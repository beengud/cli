
# MonitorRuleInput

One alert condition at one severity, as `Monitor-Rule` reports it. `ruleKind` decides which fields are used; one it does not use is rejected:  | Rule | Fields used | |---|---| | `Count`, `Threshold`, `Anomaly` | `triggerComparisons` (at least one), `groupFilters` | | `Promote` | `rowFilters` | | `level: NoData` | `expirationSeconds` (`Threshold` only) |  A `NoData` rule watches the monitor\'s `valueColumn`. Only `Threshold` and `Anomaly` monitors take one, at most one each. 

## Properties

Name | Type
------------ | -------------
`level` | [MonitorAlarmLevel](MonitorAlarmLevel.md)
`triggerComparisons` | [Array&lt;MonitorComparisonInput&gt;](MonitorComparisonInput.md)
`groupFilters` | [Array&lt;MonitorColumnFilterInput&gt;](MonitorColumnFilterInput.md)
`rowFilters` | [Array&lt;MonitorColumnFilterInput&gt;](MonitorColumnFilterInput.md)
`expirationSeconds` | number


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


