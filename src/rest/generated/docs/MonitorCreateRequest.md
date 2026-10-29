
# MonitorCreateRequest

A monitor to create, written the way `Monitor-Resource` reads. Fields the server derives (`id`, the audit fields, `health` and the other run state) are not accepted: a field not listed here, at any depth, is a `400`.  `ruleKind` decides which fields apply. One that does not apply is rejected rather than ignored:  | `ruleKind` | Requires | Rejects | |---|---|---| | `Count` | | `valueColumn`, `aggregation`, `baseline` | | `Threshold` | `valueColumn`, `aggregation` | `baseline` | | `Anomaly` | `valueColumn`, `baseline` | `aggregation`, a non-empty `scheduling` | | `Promote` | | `valueColumn`, `aggregation`, `baseline` |  `Composite` is not accepted here: create one with `POST /v1/composite-monitors`. 

## Properties

Name | Type
------------ | -------------
`name` | string
`description` | string
`disabled` | boolean
`ruleKind` | [MonitorRuleKind](MonitorRuleKind.md)
`aiTriagingMode` | [MonitorAiTriagingMode](MonitorAiTriagingMode.md)
`lookbackSeconds` | number
`dataStabilizationDelaySeconds` | number
`maxAlertsPerHour` | number
`scheduling` | [MonitorSchedulingInput](MonitorSchedulingInput.md)
`inputQuery` | [MonitorMultiStageQueryInput](MonitorMultiStageQueryInput.md)
`valueColumn` | string
`aggregation` | [MonitorValueAggregation](MonitorValueAggregation.md)
`baseline` | [MonitorBaselineInput](MonitorBaselineInput.md)
`rules` | [Array&lt;MonitorRuleInput&gt;](MonitorRuleInput.md)
`groupBy` | [Array&lt;MonitorGroupingInput&gt;](MonitorGroupingInput.md)
`serviceBindings` | [Array&lt;MonitorServiceBindingInput&gt;](MonitorServiceBindingInput.md)
`actions` | [Array&lt;MonitorActionRuleInput&gt;](MonitorActionRuleInput.md)
`customVariables` | { [key: string]: any | undefined; }


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


