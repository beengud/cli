
# MonitorResource

One monitor in full: the fields `GET /v1/monitors` returns for it, plus the query and rules that define it. Every field is required; one that can be absent comes back as an explicit null. 

## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`description` | string
`disabled` | boolean
`ruleKind` | [MonitorRuleKind](MonitorRuleKind.md)
`monitorVersion` | string
`createdBy` | [User](User.md)
`createdAt` | string
`updatedBy` | [User](User.md)
`updatedAt` | string
`disabledDetail` | [MonitorDisabledDetail](MonitorDisabledDetail.md)
`scheduled` | boolean
`rollupStatus` | [MonitorRollupStatus](MonitorRollupStatus.md)
`health` | [MonitorHealth](MonitorHealth.md)
`governorState` | [MonitorGovernorState](MonitorGovernorState.md)
`alertState` | [MonitorAlertState](MonitorAlertState.md)
`aiTriagingMode` | [MonitorAiTriagingMode](MonitorAiTriagingMode.md)
`muteState` | [MonitorMuteState](MonitorMuteState.md)
`mutedUntil` | string
`muteCount` | number
`lastErrorTime` | string
`lastAlarmTime` | string
`lastWarnTime` | string
`managedBy` | [ObjectRef](ObjectRef.md)
`lookbackSeconds` | number
`dataStabilizationDelaySeconds` | number
`maxAlertsPerHour` | number
`scheduling` | [MonitorScheduling](MonitorScheduling.md)
`inputQuery` | [MonitorMultiStageQuery](MonitorMultiStageQuery.md)
`valueColumn` | string
`aggregation` | [MonitorValueAggregation](MonitorValueAggregation.md)
`baseline` | [MonitorBaseline](MonitorBaseline.md)
`rules` | [Array&lt;MonitorRule&gt;](MonitorRule.md)
`groupBy` | [Array&lt;MonitorGrouping&gt;](MonitorGrouping.md)
`serviceBindings` | [Array&lt;MonitorServiceBinding&gt;](MonitorServiceBinding.md)
`actions` | [Array&lt;MonitorActionRule&gt;](MonitorActionRule.md)
`customVariables` | { [key: string]: any | undefined; }


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


