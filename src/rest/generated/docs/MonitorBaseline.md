
# MonitorBaseline

The baseline an anomaly monitor compares `valueColumn` against, and how far a value must stray from it. Exactly one of `basicAlgorithm` and `seasonalAlgorithm` is set. 

## Properties

Name | Type
------------ | -------------
`compareFn` | [MonitorBoundComparisonFunction](MonitorBoundComparisonFunction.md)
`computationWindowSeconds` | number
`frequencySeconds` | number
`basicAlgorithm` | [MonitorBasicAlgorithm](MonitorBasicAlgorithm.md)
`seasonalAlgorithm` | [MonitorSeasonalAlgorithm](MonitorSeasonalAlgorithm.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


