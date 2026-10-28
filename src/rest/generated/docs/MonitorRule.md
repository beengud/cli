
# MonitorRule

One alert condition at one severity: the monitor triggers an alert at `level` when every entry in `triggerComparisons` holds, for the groups (or rows) every entry in the filters matches. `ruleKind` decides which fields are used; the lists it does not use are empty: | Rule | Fields used | |---|---| | `Count`, `Threshold`, `Anomaly` | `triggerComparisons`, `groupFilters` | | `Promote` | `rowFilters` | | `level: NoData` | `expirationSeconds` (`Threshold` only) | A `NoData` rule alerts when no data arrives for a full lookback window. Only `Threshold` and `Anomaly` monitors have one, at most one each, and it watches the same `valueColumn` as the other rules. 

## Properties

Name | Type
------------ | -------------
`level` | [MonitorAlarmLevel](MonitorAlarmLevel.md)
`triggerComparisons` | [Array&lt;MonitorComparison&gt;](MonitorComparison.md)
`groupFilters` | [Array&lt;MonitorColumnFilter&gt;](MonitorColumnFilter.md)
`rowFilters` | [Array&lt;MonitorColumnFilter&gt;](MonitorColumnFilter.md)
`expirationSeconds` | number


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


