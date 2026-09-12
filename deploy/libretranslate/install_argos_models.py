"""Instala .argosmodel já copiados para a imagem (sem download)."""

from __future__ import annotations

from pathlib import Path

import argostranslate.package

MODELS_DIR = Path("/tmp/argos-models")


def main() -> None:
    files = sorted(MODELS_DIR.glob("*.argosmodel"))
    if len(files) < 6:
        raise SystemExit(
            f"esperava 6 .argosmodel em {MODELS_DIR}, achei {len(files)}. "
            "Rode no host: bash deploy/libretranslate/fetch-models.sh"
        )
    for path in files:
        print(f"Installing {path.name} ...", flush=True)
        argostranslate.package.install_from_path(path)
    installed = argostranslate.package.get_installed_packages()
    print(f"Argos models installed: {len(installed)} packages", flush=True)
    for pkg in installed:
        print(f"  - {pkg.from_code}->{pkg.to_code}", flush=True)


if __name__ == "__main__":
    main()
