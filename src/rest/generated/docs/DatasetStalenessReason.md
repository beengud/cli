
# DatasetStalenessReason

A reason explaining why a dataset\'s freshness is what it is. ConfiguredFreshnessGoal: The user-configured freshness goal is the dominant factor. CreditManagerOverride: A customer-level acceleration credit limit is forcing the freshness goal higher. SlowAcceleration: The dataset is being de-prioritized because it has not been queried recently (decay). ActiveBackfill: A backfill job is currently running for this dataset. DatasetHibernated: The dataset is hibernated. UnusedDatasetHibernating: The dataset is becoming hibernated due to lack of use. 

## Properties

Name | Type
------------ | -------------


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


