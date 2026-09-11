import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  resetAdminUserPasswordBodySchema,
  updateAdminUserBodySchema,
  UserRole,
  UserStatus,
} from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { isUuid, param } from '../../lib/params.js';
import { validateBody } from '../../middleware/validate.js';
import { hashPassword } from '../auth/auth.service.js';

export const adminUsersRouter = Router();

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    select: {
      id: true,
      role: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

function generateTempPassword(): string {
  return `Azc-${randomBytes(9).toString('base64url')}`;
}

async function findUserOr404(id: string, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (!isUuid(id)) {
    res.status(400).json({ error: 'invalid_id' });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) {
    res.status(404).json({ error: 'not_found' });
    return null;
  }
  return user;
}

async function wouldLeaveNoActiveAdmin(
  user: { id: string; role: string; status: string },
  next: { role?: string; status?: string; deleting?: boolean },
): Promise<boolean> {
  if (user.role !== UserRole.ADMIN) return false;
  const staysActiveAdmin =
    !next.deleting &&
    (next.role ?? user.role) === UserRole.ADMIN &&
    (next.status ?? user.status) === UserStatus.ACTIVE;
  if (staysActiveAdmin) return false;
  const others = await prisma.user.count({
    where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, id: { not: user.id } },
  });
  return others === 0;
}

adminUsersRouter.get('/', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const role = typeof req.query.role === 'string' ? req.query.role : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const roles = new Set<string>(Object.values(UserRole));
    const statuses = new Set<string>(Object.values(UserStatus));
    const items = await prisma.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(roles.has(role) ? { role: role as UserRole } : {}),
        ...(statuses.has(status) ? { status: status as UserStatus } : {}),
      },
      select: userSelect,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await findUserOr404(param(req.params.id), res);
    if (!user) return;
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.patch('/:id', validateBody(updateAdminUserBodySchema), async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const actorId = req.auth!.sub;
    const user = await findUserOr404(id, res);
    if (!user) return;

    const name = req.body.name as string | undefined;
    const email = req.body.email as string | undefined;
    const role = req.body.role as UserRole | undefined;

    if (role && role !== user.role) {
      if (user.id === actorId) {
        res.status(400).json({ error: 'cannot_self_role' });
        return;
      }
      if (await wouldLeaveNoActiveAdmin(user, { role })) {
        res.status(400).json({ error: 'last_admin' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
      },
      select: userSelect,
    });
    res.json({ user: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'email_taken' });
      return;
    }
    next(error);
  }
});

adminUsersRouter.post('/:id/disable', async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const user = await findUserOr404(id, res);
    if (!user) return;
    if (user.id === req.auth!.sub) {
      res.status(400).json({ error: 'cannot_self_disable' });
      return;
    }
    if (await wouldLeaveNoActiveAdmin(user, { status: UserStatus.DISABLED })) {
      res.status(400).json({ error: 'last_admin' });
      return;
    }
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.DISABLED },
        select: userSelect,
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.post('/:id/enable', async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const user = await findUserOr404(id, res);
    if (!user) return;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE },
      select: userSelect,
    });
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.post(
  '/:id/reset-password',
  validateBody(resetAdminUserPasswordBodySchema),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const user = await findUserOr404(id, res);
      if (!user) return;
      const provided =
        typeof req.body.password === 'string' ? (req.body.password as string).trim() : '';
      if (provided && provided.length < 8) {
        res.status(400).json({ error: 'validation_error' });
        return;
      }
      const temporaryPassword = provided || generateTempPassword();
      const passwordHash = await hashPassword(temporaryPassword);
      const [updated] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
          select: userSelect,
        }),
        prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      ]);
      res.json({ user: updated, temporaryPassword });
    } catch (error) {
      next(error);
    }
  },
);

adminUsersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const user = await findUserOr404(id, res);
    if (!user) return;
    if (user.id === req.auth!.sub) {
      res.status(400).json({ error: 'cannot_self_delete' });
      return;
    }
    if (await wouldLeaveNoActiveAdmin(user, { deleting: true })) {
      res.status(400).json({ error: 'last_admin' });
      return;
    }
    await prisma.user.delete({ where: { id: user.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
