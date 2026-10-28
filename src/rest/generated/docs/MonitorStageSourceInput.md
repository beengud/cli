
# MonitorStageSourceInput

One source a stage reads, as `Monitor-StageInput` reports it: exactly one of `dataset`, `datasetPath` and `stageId`. `parameterId` is not accepted: a parameter input binds against query parameters, which a monitor does not take. 

## Properties

Name | Type
------------ | -------------
`inputName` | string
`inputRole` | [MonitorInputRole](MonitorInputRole.md)
`dataset` | [DatasetRef](DatasetRef.md)
`datasetPath` | string
`stageId` | string


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


