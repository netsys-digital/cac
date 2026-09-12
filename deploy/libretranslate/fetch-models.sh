#!/usr/bin/env bash
# Baixa os .argosmodel no HOST (WSL/servidor), fora do Docker.
# O build da imagem só COPY + instala — sem internet no container.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)/models"
mkdir -p "$DIR"
BASE="${ARGOS_MODELS_BASE:-https://data.argosopentech.com/argospm/v1}"

# Pares pt/en/es. Versão 1_9 quando existe; es↔en/pt só há 1_0 no índice.
FILES=(
  translate-en_pt-1_9.argosmodel
  translate-pt_en-1_9.argosmodel
  translate-en_es-1_0.argosmodel
  translate-es_en-1_0.argosmodel
  translate-es_pt-1_0.argosmodel
  translate-pt_es-1_0.argosmodel
)

if ! command -v curl >/dev/null 2>&1; then
  echo "fetch-models.sh: precisa de curl no host" >&2
  exit 1
fi

echo "Modelos Argos → ${DIR}"
echo "Fonte: ${BASE}"

for f in "${FILES[@]}"; do
  dest="${DIR}/${f}"
  if [[ -f "$dest" ]]; then
    size="$(stat -c%s "$dest" 2>/dev/null || stat -f%z "$dest")"
    if [[ "$size" -gt 1000000 ]]; then
      echo "  já existe  ${f}  (${size} bytes)"
      continue
    fi
    echo "  incompleto  ${f} — baixando de novo"
    rm -f "$dest"
  fi
  echo "  baixando   ${f} …"
  curl -fL --retry 5 --retry-delay 3 --connect-timeout 30 \
    -o "${dest}.part" "${BASE}/${f}"
  mv "${dest}.part" "$dest"
  size="$(stat -c%s "$dest" 2>/dev/null || stat -f%z "$dest")"
  echo "  ok         ${f}  (${size} bytes)"
done

count="$(find "$DIR" -maxdepth 1 -name '*.argosmodel' | wc -l)"
echo "Pronto: ${count} arquivos .argosmodel"
if [[ "$count" -lt 6 ]]; then
  echo "faltam modelos — o Dockerfile recusa o build" >&2
  exit 1
fi
