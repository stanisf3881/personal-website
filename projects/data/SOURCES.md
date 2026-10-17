# Data sources: US gasoline prices and inflation, Jan 2015 – Feb 2020

Retrieved 2026-10-17. All data is published by U.S. government agencies and is in the public domain; please still credit the agencies.
Rebuild both CSVs with `python3 -I build_gas_dataset.py` (needs `pandas` and `xlrd`).

## Why this window
January 2015 to February 2020 is the 62 months before COVID-19 reached U.S. prices. March 2020 is excluded because the April 2020 price collapse is a pandemic shock, not the pre-COVID baseline.

## Gas prices: `us_gas_prices_precovid.csv`

**U.S. Energy Information Administration (EIA), "Regular All Formulations Retail Gasoline Prices", monthly, dollars per gallon.**

| Geography | EIA series key | Download used |
|---|---|---|
| United States | `EMM_EPMR_PTE_NUS_DPG` | <https://www.eia.gov/dnav/pet/hist_xls/EMM_EPMR_PTE_NUS_DPGm.xls> |
| PADD 1–5 (East Coast, Midwest, Gulf Coast, Rocky Mountain, West Coast) | `EMM_EPMR_PTE_R10_DPG` … `R50` | same pattern, `R10`…`R50` |
| California, Washington, Colorado, Texas, Minnesota, Ohio, Florida, New York, Massachusetts | `EMM_EPMR_PTE_SCA_DPG`, `SWA`, `SCO`, `STX`, `SMN`, `SOH`, `SFL`, `SNY`, `SMA` | same pattern, `SCA`…`SMA` |

- Landing page: <https://www.eia.gov/dnav/pet/pet_pri_gnd_dcus_nus_m.htm>
- Example series page: <https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMM_EPMR_PTE_SCA_DPG&f=M>
- Suggested citation: U.S. Energy Information Administration, *Petroleum & Other Liquids: Weekly/Monthly Retail Gasoline and Diesel Prices*, release of 14 Oct 2026.

**Coverage limit.** EIA publishes monthly retail gasoline prices for only nine states, not all 50. Conclusions about "states" in this project mean these nine (plus the five regional PADD aggregates and the U.S. average).

## Inflation: `us_inflation_precovid.csv`

**U.S. Bureau of Labor Statistics (BLS), Consumer Price Index for All Urban Consumers (CPI-U), U.S. city average**, downloaded through FRED, Federal Reserve Bank of St. Louis.

| Column | BLS series | FRED id | Page |
|---|---|---|---|
| `cpi_all_items_nsa` | CUUR0000SA0 | `CPIAUCNS` | <https://fred.stlouisfed.org/series/CPIAUCNS> |
| `cpi_all_items_sa` | CUSR0000SA0 | `CPIAUCSL` | <https://fred.stlouisfed.org/series/CPIAUCSL> |
| `cpi_core_sa` (less food and energy) | CUSR0000SA0L1E | `CPILFESL` | <https://fred.stlouisfed.org/series/CPILFESL> |
| `cpi_gasoline_nsa` (all types) | CUUR0000SETB01 | `CUUR0000SETB01` | <https://fred.stlouisfed.org/series/CUUR0000SETB01> |
| `cpi_gasoline_sa` (all types) | CUSR0000SETB01 | `CUSR0000SETB01` | <https://fred.stlouisfed.org/series/CUSR0000SETB01> |

- All CPI indexes use 1982–84 = 100.
- Suggested citation: U.S. Bureau of Labor Statistics, Consumer Price Index for All Urban Consumers, retrieved from FRED, Federal Reserve Bank of St. Louis; <https://fred.stlouisfed.org/>, 17 Oct 2026.
- `gas_price_usd_gal` in this file is the EIA national price above, placed next to CPI so one sheet can use both.

## Derived columns (calculated by `build_gas_dataset.py`)
- `*_yoy_pct`: percent change versus the same month one year earlier, from data starting Dec 2013 so Jan 2015 has a value. CPI-based columns use the not-seasonally-adjusted series, except `cpi_core_yoy_pct`, which uses the seasonally adjusted core series (BLS publishes core mainly as SA).
- `*_idx_jan2015`: the series divided by its Jan 2015 value × 100, so every line starts at 100.

## Checks performed
- The EIA national series was compared with FRED's `GASREGM` (the same EIA series republished): maximum difference 0.000 across all 62 months.
- 15 geographies × 62 months = 930 rows in the gas file, no missing values. 62 rows in the inflation file, no missing values.
- EIA dates are mid-month and FRED dates are the 1st; both are normalized to the 1st of the month.

## Caveats
- Retail prices are nominal (not adjusted for inflation).
- CPI gasoline and EIA price differ in method (index versus dollars) but move almost together (correlation 0.997 in levels).
- Headline CPI includes gasoline, so comparing gasoline with headline CPI partly measures an overlap. The guide uses core CPI to separate the two.
