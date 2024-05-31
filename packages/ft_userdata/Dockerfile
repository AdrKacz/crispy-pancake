FROM freqtradeorg/freqtrade:stable

COPY ./user_data /freqtrade/user_data

# trade
#       --db-url sqlite:////freqtrade/user_data/tradesv3.sqlite
#       --config /freqtrade/user_data/config.json
#       --strategy SampleStrategy
ENTRYPOINT [ "freqtrade", "trade", "--db-url", "sqlite:////freqtrade/user_data/tradesv3.sqlite", "--config", "/freqtrade/user_data/config.json", "--strategy", "SampleStrategy"]