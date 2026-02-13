# Domain Packs: Finance, Business, Sports

This guide defines canonical fields and agent composition guidelines for W3 domain packs.

## Finance Pack

Module: `src/domain/finance/index.ts`

Canonical metrics (10):

- `revenue`
- `operatingIncome`
- `netIncome`
- `eps`
- `freeCashFlow`
- `grossMarginPct`
- `operatingMarginPct`
- `peRatio`
- `debtToEquity`
- `marketCap`

Validation notes:

- Required canonical keys must be numeric and finite.
- Ambiguous aliases are rejected (`revenue` with `sales`/`totalRevenue`, `marketCap` with `marketCapitalization`).

## Business Pack

Module: `src/domain/business/index.ts`

Canonical metrics (10):

- `arr`
- `mrrGrowthPct`
- `churnPct`
- `cac`
- `ltv`
- `ltvCacRatio`
- `grossRetentionPct`
- `netRetentionPct`
- `pipelineCoverageRatio`
- `winRatePct`

Validation notes:

- Required canonical keys must be numeric and finite.
- Ambiguous aliases are rejected (`arr` with `annualRecurringRevenue`, `churnPct` with `churnRate`, `winRatePct` with `closeRate`).

## Sports Pack

Module: `src/domain/sports/index.ts`

Canonical metrics (10):

- `pointsPerGame`
- `assistsPerGame`
- `reboundsPerGame`
- `fieldGoalPct`
- `threePointPct`
- `turnoversPerGame`
- `offensiveRating`
- `defensiveRating`
- `winPct`
- `pace`

Validation notes:

- Required canonical keys must be numeric and finite.
- Ambiguous aliases are rejected (`fieldGoalPct` with `fgPct`, `threePointPct` with `threePtPct`, `winPct` with `winRate`).

## Mapping Guidelines

1. Normalize source keys into canonical keys before composing scenes.
2. Run `validate*Stats()` for the selected domain before rendering.
3. Convert domain data with `to*Series()` to produce render-ready labels and values.
4. Use `create*DomainExampleProject()` for baseline scene composition.

## Agent Prompt Composition

Use this pattern in prompts when building scenes from domain packs:

```
Use the <domain> domain pack.
Input keys are canonical only.
Validate the payload before transformation.
Transform with to<Domain>Series().
Compose text/chart layers directly from transformed metrics.
Reject ambiguous alias fields.
```

Examples:

- `createFinanceDomainExampleProject(financeSampleDatasets['large-cap-tech'])`
- `createBusinessDomainExampleProject(businessSampleDatasets['saas-scale-up'])`
- `createSportsDomainExampleProject(sportsSampleDatasets['contender-team'])`
