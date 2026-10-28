
# MonitorBaselineInput

The baseline an anomaly monitor compares `valueColumn` against, as `Monitor-Baseline` reports it. Exactly one of `basicAlgorithm` and `seasonalAlgorithm`. Required for `Anomaly`. 

## Properties

Name | Type
------------ | -------------
`compareFn` | [MonitorBoundComparisonFunction](MonitorBoundComparisonFunction.md)
`computationWindowSeconds` | number
`frequencySeconds` | number
`basicAlgorithm` | [MonitorBasicAlgorithm](MonitorBasicAlgorithm.md)
`seasonalAlgorithm` | [MonitorSeasonalAlgorithmInput](MonitorSeasonalAlgorithmInput.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


