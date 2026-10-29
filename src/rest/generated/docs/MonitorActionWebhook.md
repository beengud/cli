
# MonitorActionWebhook

A webhook notification\'s payload, also used for PagerDuty and Slack. A PagerDuty routing key is part of the `body` template, not a field of its own. 

## Properties

Name | Type
------------ | -------------
`url` | string
`method` | [MonitorActionHttpMethod](MonitorActionHttpMethod.md)
`headers` | [Array&lt;MonitorActionWebhookHeader&gt;](MonitorActionWebhookHeader.md)
`body` | string
`fragments` | { [key: string]: any | undefined; }


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


