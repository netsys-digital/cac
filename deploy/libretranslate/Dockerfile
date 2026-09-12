FROM libretranslate/libretranslate:v1.9.6

# Modelos vêm do host (fetch-models.sh). O RUN não acessa a internet.
USER root
COPY models/*.argosmodel /tmp/argos-models/
COPY install_argos_models.py /tmp/install_argos_models.py
RUN chown -R libretranslate:libretranslate /tmp/argos-models /tmp/install_argos_models.py

USER libretranslate
WORKDIR /app
ENV HOME=/home/libretranslate \
    LT_UPDATE_MODELS=false \
    LT_LOAD_ONLY=en,es,pt \
    LT_DISABLE_WEB_UI=true

RUN ./venv/bin/python /tmp/install_argos_models.py \
    && rm -f /tmp/argos-models/*.argosmodel
