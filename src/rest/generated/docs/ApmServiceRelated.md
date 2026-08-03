
# ApmServiceRelated

Per-row correlation hints on Service. Always present; values may be empty. correlationTags maps Service field name to OTel/system attribute keys; metrics is the discovery list of related queryable metrics. 

## Properties

Name | Type
------------ | -------------
`correlationTags` | { [key: string]: Array&lt;string&gt; | undefined; }
`metrics` | [Array&lt;ApmMetricRef&gt;](ApmMetricRef.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


