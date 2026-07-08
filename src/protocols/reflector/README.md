## Reflector Extension for the Stellar Indexer SDK

This extension uses the custom endpoints from the Stellar Indexer service designed for Reflector. This extension
requires a token that has access to the contracts' data package.

### `fetchOraclesData`

This method will get an object with all three pulse oracles and their data, the response will follow the
`ReflectorOraclesResultSchema` schema, here is an example of a record inside this object:

```json
{
  "id": "CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN",
  "assets": [
    "BTC",
    "ETH",
    "USDT",
    "XRP",
    "SOL",
    "USDC",
    "ADA",
    "AVAX",
    "DOT",
    "MATIC",
    "LINK",
    "DAI",
    "ATOM",
    "XLM",
    "UNI",
    "EURC"
  ],
  "base_asset": "USD",
  "decimals": 14,
  "last_timestamp": "1783475100000",
  "period": "86400000",
  "protocol": 2,
  "protocol_update": "0",
  "resolution": 300000
}
```

### `fetchHistoricalPrices`

This method will get prices published by reflector in the range provided (or the default), and will get a record per
period specified. By default, it will be "day" so that means it will get the latest record per day. Here is an example
of the response:

```json
{
  "oracle": "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC",
  "decimals": 14,
  "base_asset": "USD",
  "prices": [
    {
      "timestamp": "1783479900000",
      "assets": {
        "EUR": "114226762398596",
        "GBP": "133728251843033",
        "CAD": "70393634416534",
        "BRL": "19450162900104",
        "JPY": "617152219801",
        "CNY": "14718279896670",
        "MXN": "5727693942340",
        "KRW": "66062859434",
        "TRY": "2134329889650",
        "ARS": "67034212170",
        "PEN": "29357972773848",
        "VES": "148348825648",
        "CLP": "107800007903",
        "CRC": "219603771024",
        "CDF": "43650035710",
        "COP": "29919571462",
        "HKD": "12751502797899",
        "INR": "1051518625094",
        "NGN": "72842411579",
        "PHP": "1626581388251",
        "RUB": "1307535026460",
        "ZAR": "6150712844596",
        "XAU": "413734565789211487",
        "KES": "773870497101"
      },
      "date": "2026-07-08T03:05:00.000Z"
    }
  ]
}
```
