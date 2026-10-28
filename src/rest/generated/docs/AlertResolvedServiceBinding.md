
# AlertResolvedServiceBinding

Service an alert is attributed to. Present whenever the alert\'s monitor has a service binding. serviceName, environment, and serviceNamespace are empty strings when that value is missing. Omitted only when the monitor has no service binding. serviceType is Service, Database, or MessageBroker, and is left out when serviceName is empty. 

## Properties

Name | Type
------------ | -------------
`serviceName` | string
`environment` | string
`serviceNamespace` | string
`serviceType` | [AlertResolvedServiceType](AlertResolvedServiceType.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


