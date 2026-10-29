
# MonitorActionWebhookInput

A webhook notification\'s payload, also used for PagerDuty and Slack. A PagerDuty routing key goes in the `body` template. 

## Properties

Name | Type
------------ | -------------
`url` | string
`method` | [MonitorActionHttpMethod](MonitorActionHttpMethod.md)
`headers` | [Array&lt;MonitorActionWebhookHeaderInput&gt;](MonitorActionWebhookHeaderInput.md)
`body` | string
`fragments` | { [key: string]: string | undefined; }


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


