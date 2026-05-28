# Muadi Protocol - OpenFly verified notes

Verified on production read-only search, captured 2026-05-28.

## Scope

This document covers Muadi login and flight search only. It does not cover booking creation, payment, ticketing, seat, baggage, or ancillary purchase.

## Base URL

Production:

```text
https://api-gateway.muadi.com.vn/api
```

Sandbox note: login works after the same gateway headers, but booking search in sandbox was observed to require a different envelope field named `request`. OpenFly currently targets production for search, where the envelope is `{ encrypted }`.

## Encryption

- Algorithm: AES-128-CBC.
- Padding: PKCS#7 through Node.js `crypto` default auto padding.
- Request body envelope: `{ "encrypted": "<base64 ciphertext>" }`.
- Response body is plain JSON. Do not decrypt Muadi responses.
- AES key and IV must be exactly 16 UTF-8 bytes from env.

## Required headers

Every request, including unauthenticated login:

```text
Client-Type: Web
X-Language: vi
Origin: https://booking.namthanh.vn
Referer: https://booking.namthanh.vn/
Content-Type: application/json
tsp: <AES-128-CBC encrypted unix_seconds + serverDiff>
```

Authenticated requests also include:

```text
authorization: <raw Muadi access token>
X-Api-Version: 2
```

Login intentionally omits `authorization` and `X-Api-Version`.

## Login

Endpoint:

```text
POST /auth/login
```

Plain payload before encryption:

```json
{
  "UserName": "<env MUADI_USERNAME>",
  "Password": "<env MUADI_PASSWORD>",
  "AgentCode": "<env MUADI_AGENT_CODE>",
  "Otp": "AB12"
}
```

Verified quirk:

- `Otp` must be short. A 16-character hex OTP caused Muadi `500 code=99`; a 4-character uppercase value succeeded.
- OpenFly now generates 4 uppercase hex characters.

## Token refresh

Endpoint:

```text
POST /auth/refresh-token
```

The client currently tries the four variants inherited from the Nam Thanh reference:

1. `{ accessToken, refreshToken, channel: "Web" }`
2. `{ refreshToken }`
3. `{ token: refreshToken }`
4. `{ refresh_token: refreshToken }`

Production smoke search showed these variants can return HTTP 400 for the current token shape, then login fallback succeeds. The Muadi access token also appears opaque or not JWT-decodable in this environment, so expiry detection by JWT `exp` is not reliable yet. This is a known follow-up candidate; search itself is verified.

## Search flow

### Step 1 - create search session

Endpoint:

```text
POST /booking/create-session
```

Plain payload before encryption:

```json
{
  "originCode": "SGN",
  "destinationCode": "HAN",
  "departureDateTime": "11-06-2026",
  "journeyType": "OW",
  "numberOfAdult": 1,
  "numberOfChildren": 0,
  "numberOfInfant": 0,
  "currencyCode": "VND",
  "searchType": "BP",
  "promotionCodes": [],
  "airlines": [],
  "systems": []
}
```

Date quirk:

- OpenFly DTO accepts ISO date `YYYY-MM-DD`.
- Muadi production requires `DD-MM-YYYY`.
- Conversion happens only at the Muadi boundary.

Response includes `sessionID` and `listSignIn`.

### Step 2 - search each airline

Endpoint:

```text
POST /booking/search-flight/{airline}
```

Payload is the create-session payload plus:

```json
{
  "sessionID": 123456
}
```

Search calls are run in parallel per airline from `listSignIn`. Partial airline failures are preserved in `airlinesFailed`. In the verified SGN-HAN run, `9G` appeared in `listSignIn` but the provider search reported HTTP 401 for that airline during the parallel batch; other airlines still returned offers. A direct sample call for `9G` later returned a valid raw response, so treat this as a Muadi/provider transient or session timing quirk.

## Production response shape

Search response is plain JSON and may be wrapped under `data`.

```ts
type SearchPayload = {
  departureFlight?: Flight[];
  returnFlight?: Flight[];
  gdsFlight?: {
    departureFlight?: Flight[];
    returnFlight?: Flight[];
  };
  bookingFees?: BookingFee[];
  source?: unknown;
};
```

### Flight

```ts
type Flight = {
  airline: string;
  from: string;
  to: string;
  departDateTime: string; // "DD-MM-YYYY HH:mm"
  lowestFare: number;
  numberOfStop: number;
  issueFeeADT?: number;
  issueFeeCHD?: number;
  routeInfo: Segment[];
  priceInfo: FareOption[];
};
```

### Segment

```ts
type Segment = {
  from: string;
  to: string;
  flightTimeHour: number;
  flightTimeMinute: number;
  departDate: string; // "DD-MM-YYYY HH:mm"
  arrivalDate: string; // "DD-MM-YYYY HH:mm"
  airCraft: string;
  flightNumber: string;
  carrierCode: string;
  carrierName: string;
  departureCity: string;
  arrivalCity: string;
  startTerminal?: string;
  endTerminal?: string;
  marketingCarrier?: string;
  operatingCarrier?: string;
  operatingCarrierName?: string;
};
```

### Fare option

```ts
type FareOption = {
  class: string;
  seatAvailable: number;
  fareADT: number;
  taxADT: number;
  vatADT: number;
  fareCHD: number;
  taxCHD: number;
  vatCHD: number;
  fareINF: number;
  taxINF: number;
  vatINF: number;
  issueFeeADT?: number;
  fareInfo: Array<{
    market: string;
    class: string;
    cabinClass: string;
    fareBasis: string;
    seatAvailable: number;
    baggageInformations?: Array<{
      type: string;
      pieces?: number;
      description?: string;
    }>;
  }>;
  refundable?: boolean;
  changeable?: boolean;
  currencyCode?: string;
};
```

## OpenFly normalization rules

### Date and time

Muadi local time is treated as Vietnam time, UTC+7.

Example:

```text
11-06-2026 16:40 -> 2026-06-11T16:40:00+07:00
```

### Segment mapping

- `from.code` = `routeInfo.from`
- `from.city` = `routeInfo.departureCity`
- `to.code` = `routeInfo.to`
- `to.city` = `routeInfo.arrivalCity`
- `flightNumber` = `carrierCode + flightNumber`
- `durationMinutes` = `flightTimeHour * 60 + flightTimeMinute`
- `aircraft` = `airCraft`

### Fare price formula

Per adult, VND nguyên đồng:

```text
baseFareVnd  = fareADT
taxesFeesVnd = taxADT + vatADT + issueFeeADT
priceVnd     = fareADT + taxADT + vatADT + issueFeeADT
```

Issue fee lookup order:

1. `priceInfo.issueFeeADT`
2. `flight.issueFeeADT`
3. `flight.bookingFee[].issueFeeADT` or `flight.bookingFees[].issueFeeADT`
4. `0`

Availability:

```text
soldOut = seatAvailable <= 0
cheapestPriceVnd = min(priceVnd) across non-sold-out fare classes
```

## Verified smoke result

Query:

```text
SGN -> HAN, 2026-06-11, ADT=1, CHD=0, INF=0
```

Result:

- `offers.length = 60`
- `airlinesQueried = ["9G","QH","VJ","VN","VU"]`
- `airlinesFailed = [{"airline":"9G","reason":"Muadi HTTP 401"}]`
- First normalized offer: `QH286`, `Tp. Hồ Chí Minh -> Hà Nội`, `2026-06-11T20:50:00+07:00`
- First offer cheapest fare: `1,839,000 + 753,000 = 2,592,000 VND`

Sanitized fixture:

```text
apps/api/src/integrations/muadi/fixtures/muadi-search-sample.json
```
