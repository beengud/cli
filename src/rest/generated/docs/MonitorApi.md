# MonitorApi

All URIs are relative to *https://OBSERVE_CUSTOMERID.observeinc.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createMonitor**](MonitorApi.md#createmonitor) | **POST** /v1/monitors | Create a new MonitorV2 and bind to actions |
| [**createMonitorMuteRule**](MonitorApi.md#createmonitormuterule) | **POST** /v1/monitor-mute-rules | Create a new MonitorV2 Mute Rule |
| [**deleteMonitor**](MonitorApi.md#deletemonitor) | **DELETE** /v1/monitors/{id} | Delete a MonitorV2 |
| [**deleteMonitorMuteRule**](MonitorApi.md#deletemonitormuterule) | **DELETE** /v1/monitor-mute-rules/{id} | Delete a MonitorV2 Mute Rule |
| [**getMonitor**](MonitorApi.md#getmonitor) | **GET** /v1/monitors/{id} | Get a MonitorV2 |
| [**getMonitorMuteRule**](MonitorApi.md#getmonitormuterule) | **GET** /v1/monitor-mute-rules/{id} | Get a MonitorV2 Mute Rule |
| [**listMonitorMuteRules**](MonitorApi.md#listmonitormuterules) | **GET** /v1/monitor-mute-rules | List MonitorV2 Mute Rules with optional filters |
| [**listMonitors**](MonitorApi.md#listmonitors) | **GET** /v1/monitors | List MonitorV2 instances with optional filters |
| [**updateMonitor**](MonitorApi.md#updatemonitor) | **PATCH** /v1/monitors/{id} | Update a MonitorV2 |



## createMonitor

> MonitorV2 createMonitor(monitorV2)

Create a new MonitorV2 and bind to actions

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { CreateMonitorRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // MonitorV2 | The MonitorV2 to create
    monitorV2: ...,
  } satisfies CreateMonitorRequest;

  try {
    const data = await api.createMonitor(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **monitorV2** | [MonitorV2](MonitorV2.md) | The MonitorV2 to create | |

### Return type

[**MonitorV2**](MonitorV2.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | The monitor was created |  * Location - The URI to the newly created monitor <br>  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createMonitorMuteRule

> MonitorV2MuteRule createMonitorMuteRule(monitorV2MuteRule)

Create a new MonitorV2 Mute Rule

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { CreateMonitorMuteRuleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // MonitorV2MuteRule | The MonitorV2 Mute Rule to create
    monitorV2MuteRule: ...,
  } satisfies CreateMonitorMuteRuleRequest;

  try {
    const data = await api.createMonitorMuteRule(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **monitorV2MuteRule** | [MonitorV2MuteRule](MonitorV2MuteRule.md) | The MonitorV2 Mute Rule to create | |

### Return type

[**MonitorV2MuteRule**](MonitorV2MuteRule.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | The mute rule was created |  * Location - The URI to the newly created mute rule <br>  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteMonitor

> deleteMonitor(id)

Delete a MonitorV2

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { DeleteMonitorRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // number | The Monitor object id
    id: 56,
  } satisfies DeleteMonitorRequest;

  try {
    const data = await api.deleteMonitor(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | The Monitor object id | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | The object was deleted |  -  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteMonitorMuteRule

> deleteMonitorMuteRule(id)

Delete a MonitorV2 Mute Rule

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { DeleteMonitorMuteRuleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // number | The Mute Rule object id
    id: 56,
  } satisfies DeleteMonitorMuteRuleRequest;

  try {
    const data = await api.deleteMonitorMuteRule(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | The Mute Rule object id | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | The object was deleted |  -  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getMonitor

> MonitorV2 getMonitor(id)

Get a MonitorV2

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { GetMonitorRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // number | The Monitor object id
    id: 56,
  } satisfies GetMonitorRequest;

  try {
    const data = await api.getMonitor(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | The Monitor object id | [Defaults to `undefined`] |

### Return type

[**MonitorV2**](MonitorV2.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The object is returned  |  -  |
| **404** | The object was not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getMonitorMuteRule

> MonitorV2MuteRule getMonitorMuteRule(id)

Get a MonitorV2 Mute Rule

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { GetMonitorMuteRuleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // number | The Mute Rule object id
    id: 56,
  } satisfies GetMonitorMuteRuleRequest;

  try {
    const data = await api.getMonitorMuteRule(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | The Mute Rule object id | [Defaults to `undefined`] |

### Return type

[**MonitorV2MuteRule**](MonitorV2MuteRule.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The object is returned  |  -  |
| **404** | The object was not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listMonitorMuteRules

> Array&lt;MonitorV2MuteRuleTerse&gt; listMonitorMuteRules(nameExact, nameSubstring)

List MonitorV2 Mute Rules with optional filters

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { ListMonitorMuteRulesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // string | limit to an exact string match (optional)
    nameExact: nameExact_example,
    // string | limit to a substring match (optional)
    nameSubstring: nameSubstring_example,
  } satisfies ListMonitorMuteRulesRequest;

  try {
    const data = await api.listMonitorMuteRules(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **nameExact** | `string` | limit to an exact string match | [Optional] [Defaults to `undefined`] |
| **nameSubstring** | `string` | limit to a substring match | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;MonitorV2MuteRuleTerse&gt;**](MonitorV2MuteRuleTerse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | An array of mute rule objects is returned  |  -  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listMonitors

> Array&lt;MonitorV2Terse&gt; listMonitors(nameExact, nameSubstring)

List MonitorV2 instances with optional filters

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { ListMonitorsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // string | limit to an exact string match (optional)
    nameExact: nameExact_example,
    // string | limit to a substring match (optional)
    nameSubstring: nameSubstring_example,
  } satisfies ListMonitorsRequest;

  try {
    const data = await api.listMonitors(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **nameExact** | `string` | limit to an exact string match | [Optional] [Defaults to `undefined`] |
| **nameSubstring** | `string` | limit to a substring match | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;MonitorV2Terse&gt;**](MonitorV2Terse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | An array of monitor objects is returned  |  -  |
| **400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateMonitor

> updateMonitor(id, monitorV2PatchRequest)

Update a MonitorV2

Partially updates a monitor. Only **PATCH** is supported for this URL.  **Top-level merge:** The server reads the current monitor, then for each of these properties—&#x60;name&#x60;, &#x60;disabled&#x60;, &#x60;description&#x60;, &#x60;ruleKind&#x60;, &#x60;definition&#x60;, &#x60;actionRules&#x60;—uses the request value if the key is present in the body, otherwise keeps the stored value. Keys omitted from the body do not change.  **Replace entire subtrees:** If &#x60;definition&#x60; or &#x60;actionRules&#x60; appears in the body, it **replaces the whole** stored &#x60;definition&#x60; or &#x60;actionRules&#x60; value. The server does **not** deep-merge inside &#x60;definition&#x60;, inside individual action rules, or inside nested structures (for example an action rule’s &#x60;definition&#x60;). To change part of the monitor definition or action configuration, send the complete &#x60;definition&#x60; and/or full &#x60;actionRules&#x60; array you want saved.  **Not controlled by the body:** Other monitor fields (such as &#x60;id&#x60; from the path, or &#x60;monitorVersion&#x60;) are not updated from this JSON body using the merge rules above.  **Extra properties:** Any other top-level JSON properties in the body are ignored for this merge (they are not written to the monitor). 

### Example

```ts
import {
  Configuration,
  MonitorApi,
} from '';
import type { UpdateMonitorRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new MonitorApi(config);

  const body = {
    // number | The Monitor object id
    id: 56,
    // MonitorV2PatchRequest | Any subset of patchable fields. Omitted keys among `name`, `disabled`, `description`, `ruleKind`, `definition`, and `actionRules` leave the corresponding stored values unchanged. When `definition` or `actionRules` is sent, it must be the full replacement value for that field.  (optional)
    monitorV2PatchRequest: ...,
  } satisfies UpdateMonitorRequest;

  try {
    const data = await api.updateMonitor(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | The Monitor object id | [Defaults to `undefined`] |
| **monitorV2PatchRequest** | [MonitorV2PatchRequest](MonitorV2PatchRequest.md) | Any subset of patchable fields. Omitted keys among &#x60;name&#x60;, &#x60;disabled&#x60;, &#x60;description&#x60;, &#x60;ruleKind&#x60;, &#x60;definition&#x60;, and &#x60;actionRules&#x60; leave the corresponding stored values unchanged. When &#x60;definition&#x60; or &#x60;actionRules&#x60; is sent, it must be the full replacement value for that field.  | [Optional] |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | The object was updated  |  -  |
| **400** | Invalid request |  -  |
| **404** | The object was not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

