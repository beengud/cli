
# MonitorV2CorrelationTag

Marker on a `MonitorV2Column` indicating that the column is grouping by a correlation tag (e.g. `service.name`) rather than a specific physical column. The per-column struct is a slim marker that only carries the tag name; the resolved `(tag, backing-column)` mapping for every correlation tag in the schema lives on `MonitorV2AlertSchema.correlationTags`, which is the single source of truth for tag-to-column resolution. 

## Properties

Name | Type
------------ | -------------
`tag` | string


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


