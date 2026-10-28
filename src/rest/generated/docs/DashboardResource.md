
# DashboardResource

Dashboard resource returned by List, Get, Create, and Update.  `definition` is `null` in list responses (envelope metadata only) and populated for Get, Create, and Update.  When `expand=true`, `createdBy` and `updatedBy` include display fields (e.g. `label`); `managedBy.record` is populated. Without `expand`, references contain only `id`. 

## Properties

Name | Type
------------ | -------------
`id` | string
`schemaVersion` | [DashboardResourceSchemaVersion](DashboardResourceSchemaVersion.md)
`name` | string
`description` | string
`createdAt` | string
`updatedAt` | string
`createdBy` | [User](User.md)
`updatedBy` | [User](User.md)
`managedBy` | [ObjectRef](ObjectRef.md)
`visibility` | [DashboardResourceVisibility](DashboardResourceVisibility.md)
`objectTags` | { [key: string]: Array&lt;string&gt; | undefined; }
`definition` | [DashboardContent](DashboardContent.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


