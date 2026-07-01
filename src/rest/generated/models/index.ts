/* tslint:disable */
/* eslint-disable */
/**
 * Statistics about notification actions taken for this alert
 * @export
 * @interface AlertActionStats
 */
export interface AlertActionStats {
    /**
     * 
     * @type {string}
     * @memberof AlertActionStats
     */
    numNotifsDiscarded: string;
    /**
     * 
     * @type {string}
     * @memberof AlertActionStats
     */
    numNotifsMuted: string;
    /**
     * When the alert was last muted. Null if never muted.
     * @type {string}
     * @memberof AlertActionStats
     */
    lastMutedAt: string | null;
    /**
     * 
     * @type {string}
     * @memberof AlertActionStats
     */
    numNotifsSent: string;
    /**
     * When a notification was last sent. Null if never sent.
     * @type {string}
     * @memberof AlertActionStats
     */
    lastSentAt: string | null;
    /**
     * 
     * @type {string}
     * @memberof AlertActionStats
     */
    numErrors: string;
    /**
     * When the last notification error occurred. Null if no errors.
     * @type {string}
     * @memberof AlertActionStats
     */
    lastErroredAt: string | null;
}
/**
 * A value captured at the time the alert was triggered
 * @export
 * @interface AlertCapturedValue
 */
export interface AlertCapturedValue {
    /**
     * 
     * @type {Array<AlertCapturedValueType>}
     * @memberof AlertCapturedValue
     */
    types: Array<AlertCapturedValueType>;
    /**
     * 
     * @type {AlertColumn}
     * @memberof AlertCapturedValue
     */
    column: AlertColumn;
    /**
     * The captured cell value. Null when the cell had no value.
     * @type {string}
     * @memberof AlertCapturedValue
     */
    value: string | null;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum AlertCapturedValueType {
    Aggregation = 'Aggregation',
    GroupBy = 'GroupBy',
    LinkSourceField = 'LinkSourceField'
}

/**
 * A column reference, either a direct column path, a link column, or a
 * correlation tag. Exactly one of `linkColumn`, `columnPath`, or
 * `correlationTag` is non-null.
 * 
 * @export
 * @interface AlertColumn
 */
export interface AlertColumn {
    /**
     * 
     * @type {AlertLinkColumn}
     * @memberof AlertColumn
     */
    linkColumn: AlertLinkColumn | null;
    /**
     * 
     * @type {AlertColumnPath}
     * @memberof AlertColumn
     */
    columnPath: AlertColumnPath | null;
    /**
     * 
     * @type {AlertCorrelationTag}
     * @memberof AlertColumn
     */
    correlationTag: AlertCorrelationTag | null;
}
/**
 * 
 * @export
 * @interface AlertColumnPath
 */
export interface AlertColumnPath {
    /**
     * The column's identifier within its dataset. This is the programmatic
     * name used to look up the column, not a display label.
     * 
     * @type {string}
     * @memberof AlertColumnPath
     */
    name: string;
    /**
     * Optional dotted path into a nested column. Null when absent.
     * @type {string}
     * @memberof AlertColumnPath
     */
    path: string | null;
}
/**
 * A context entry representing a grouping value for which the alert triggered
 * @export
 * @interface AlertContextEntry
 */
export interface AlertContextEntry {
    /**
     * 
     * @type {AlertColumn}
     * @memberof AlertContextEntry
     */
    column: AlertColumn;
    /**
     * 
     * @type {string}
     * @memberof AlertContextEntry
     */
    value: string;
}
/**
 * A correlation tag reference. The tag identifier is the canonical
 * name; the resolved backing column(s) are server-side details and
 * not part of the wire shape.
 * 
 * @export
 * @interface AlertCorrelationTag
 */
export interface AlertCorrelationTag {
    /**
     * Canonical correlation tag identifier.
     * @type {string}
     * @memberof AlertCorrelationTag
     */
    tag: string;
}
/**
 * A single facet value and its alert count.
 * @export
 * @interface AlertFacetEntry
 */
export interface AlertFacetEntry {
    /**
     * The facet value used for filtering (e.g. "Active", "Critical", a
     * monitor ID, or "true"/"false" for boolean facets).
     * 
     * @type {string}
     * @memberof AlertFacetEntry
     */
    key: string;
    /**
     * Human-readable display label. For most facets this equals key.
     * For monitors, this is the monitor label while key is the monitor ID.
     * Null when no label is needed (i.e. it would equal key).
     * 
     * @type {string}
     * @memberof AlertFacetEntry
     */
    label: string | null;
    /**
     * Number of alerts matching this facet value.
     * @type {string}
     * @memberof AlertFacetEntry
     */
    count: string;
}
/**
 * Faceted counts of all alerts in the requested time window, grouped by
 * key attributes. Computed independently of any filter or pagination
 * parameters.
 * 
 * @export
 * @interface AlertFacets
 */
export interface AlertFacets {
    /**
     * Count of alerts grouped by status (Active, Ended, Retracted).
     * @type {Array<AlertFacetEntry>}
     * @memberof AlertFacets
     */
    byStatus: Array<AlertFacetEntry>;
    /**
     * Count of alerts grouped by severity level.
     * @type {Array<AlertFacetEntry>}
     * @memberof AlertFacets
     */
    byLevel: Array<AlertFacetEntry>;
    /**
     * Count of alerts grouped by monitor, ordered by count descending.
     * @type {Array<AlertFacetEntry>}
     * @memberof AlertFacets
     */
    byMonitor: Array<AlertFacetEntry>;
    /**
     * Count of alerts grouped by mute status.
     * @type {Array<AlertFacetEntry>}
     * @memberof AlertFacets
     */
    byMuted: Array<AlertFacetEntry>;
}
/**
 * Severity level of the alert
 * @export
 * @enum {string}
 */
export enum AlertLevel {
    Critical = 'Critical',
    Error = 'Error',
    Warning = 'Warning',
    Informational = 'Informational',
    NoData = 'NoData',
    None = 'None'
}

/**
 * 
 * @export
 * @interface AlertLinkColumn
 */
export interface AlertLinkColumn {
    /**
     * The link column's identifier. This is the programmatic name used to
     * look up the column, not a display label.
     * 
     * @type {string}
     * @memberof AlertLinkColumn
     */
    name: string;
    /**
     * 
     * @type {AlertLinkColumnMeta}
     * @memberof AlertLinkColumn
     */
    meta: AlertLinkColumnMeta | null;
}
/**
 * 
 * @export
 * @interface AlertLinkColumnMeta
 */
export interface AlertLinkColumnMeta {
    /**
     * 
     * @type {Array<AlertColumnPath>}
     * @memberof AlertLinkColumnMeta
     */
    srcFields: Array<AlertColumnPath> | null;
    /**
     * 
     * @type {Array<string>}
     * @memberof AlertLinkColumnMeta
     */
    dstFields: Array<string> | null;
    /**
     * 
     * @type {ObjectRef}
     * @memberof AlertLinkColumnMeta
     */
    targetDataset: ObjectRef | null;
}
/**
 * 
 * @export
 * @interface AlertListResponse
 */
export interface AlertListResponse {
    /**
     * 
     * @type {Array<AlertResource>}
     * @memberof AlertListResponse
     */
    alerts: Array<AlertResource>;
    /**
     * 
     * @type {Meta}
     * @memberof AlertListResponse
     */
    meta: Meta;
    /**
     * Faceted counts for key alert attributes across all alerts in the time
     * window. Independent of filter and pagination. Only included when
     * includeFacets=true.
     * 
     * @type {AlertFacets}
     * @memberof AlertListResponse
     */
    facets?: AlertFacets;
}
/**
 * Fully-resolved service-binding triplet for an alert. Mirrors the
 * GraphQL MonitorV2AlarmServiceBinding type. All three fields are
 * non-empty when the object is populated; the field is omitted when
 * no resolved triplet exists for the alert.
 * 
 * @export
 * @interface AlertResolvedServiceBinding
 */
export interface AlertResolvedServiceBinding {
    /**
     * Value of the `service.name` correlation tag.
     * @type {string}
     * @memberof AlertResolvedServiceBinding
     */
    serviceName: string;
    /**
     * Value of the `deployment.environment.name` correlation tag.
     * @type {string}
     * @memberof AlertResolvedServiceBinding
     */
    environment: string;
    /**
     * Value of the `service.namespace` correlation tag.
     * @type {string}
     * @memberof AlertResolvedServiceBinding
     */
    serviceNamespace: string;
}
/**
 * A monitor alert representing a detected condition.
 * @export
 * @interface AlertResource
 */
export interface AlertResource {
    /**
     * Unique identifier for the alert
     * @type {string}
     * @memberof AlertResource
     */
    id: string;
    /**
     * When the alert condition first occurred
     * @type {string}
     * @memberof AlertResource
     */
    start: string;
    /**
     * When the alert condition ended. Null for active alerts.
     * @type {string}
     * @memberof AlertResource
     */
    end: string | null;
    /**
     * When the alert start was detected by the monitoring system. Null when not yet detected.
     * @type {string}
     * @memberof AlertResource
     */
    detectedStart: string | null;
    /**
     * When the alert end was detected by the monitoring system. Null for active alerts.
     * @type {string}
     * @memberof AlertResource
     */
    detectedEnd: string | null;
    /**
     * 
     * @type {AlertStatus}
     * @memberof AlertResource
     */
    status: AlertStatus;
    /**
     * 
     * @type {AlertLevel}
     * @memberof AlertResource
     */
    level: AlertLevel;
    /**
     * Hash of the grouping values for this alert
     * @type {string}
     * @memberof AlertResource
     */
    groupingHash: string;
    /**
     * 
     * @type {Array<AlertCapturedValue>}
     * @memberof AlertResource
     */
    capturedValues: Array<AlertCapturedValue>;
    /**
     * 
     * @type {Array<AlertContextEntry>}
     * @memberof AlertResource
     */
    context: Array<AlertContextEntry>;
    /**
     * Version of the monitor when this alert was created
     * @type {string}
     * @memberof AlertResource
     */
    monitorVersion: string;
    /**
     * Reference to the monitor that generated this alert. Always carries
     * the id; the `record` field is populated only when expand=true.
     * 
     * @type {MonitorRef}
     * @memberof AlertResource
     */
    monitor: MonitorRef;
    /**
     * Whether the alert is currently muted by active mute rules.
     * @type {boolean}
     * @memberof AlertResource
     */
    muted: boolean;
    /**
     * 
     * @type {AlertResolvedServiceBinding}
     * @memberof AlertResource
     */
    resolvedServiceBinding?: AlertResolvedServiceBinding | null;
    /**
     * Action statistics for this alert. Only included when expand=true.
     * @type {AlertActionStats}
     * @memberof AlertResource
     */
    stats?: AlertActionStats;
}


/**
 * Current status of the alert
 * @export
 * @enum {string}
 */
export enum AlertStatus {
    Active = 'Active',
    Ended = 'Ended',
    Retracted = 'Retracted'
}

/**
 * 
 * @export
 * @interface ApiTokenCreateRequest
 */
export interface ApiTokenCreateRequest {
    /**
     * 
     * @type {string}
     * @memberof ApiTokenCreateRequest
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenCreateRequest
     */
    description?: string;
    /**
     * 
     * @type {number}
     * @memberof ApiTokenCreateRequest
     */
    lifetimeHours: number;
}
/**
 * 
 * @export
 * @interface ApiTokenListResponse
 */
export interface ApiTokenListResponse {
    /**
     * 
     * @type {Array<ApiTokenResource>}
     * @memberof ApiTokenListResponse
     */
    apiTokens: Array<ApiTokenResource>;
    /**
     * 
     * @type {Meta}
     * @memberof ApiTokenListResponse
     */
    meta: Meta;
}
/**
 * 
 * @export
 * @interface ApiTokenResource
 */
export interface ApiTokenResource {
    /**
     * 
     * @type {string}
     * @memberof ApiTokenResource
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenResource
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenResource
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenResource
     */
    expiration: string;
    /**
     * 
     * @type {User}
     * @memberof ApiTokenResource
     */
    createdBy: User;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenResource
     */
    createdAt: string;
    /**
     * 
     * @type {User}
     * @memberof ApiTokenResource
     */
    updatedBy: User;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenResource
     */
    updatedAt: string;
    /**
     * 
     * @type {boolean}
     * @memberof ApiTokenResource
     */
    disabled: boolean;
    /**
     * The secret for the API token. Only returned on create.
     * @type {string}
     * @memberof ApiTokenResource
     */
    secret?: string;
}
/**
 * 
 * @export
 * @interface ApiTokenUpdateRequest
 */
export interface ApiTokenUpdateRequest {
    /**
     * 
     * @type {string}
     * @memberof ApiTokenUpdateRequest
     */
    label?: string;
    /**
     * 
     * @type {string}
     * @memberof ApiTokenUpdateRequest
     */
    description?: string;
    /**
     * 
     * @type {number}
     * @memberof ApiTokenUpdateRequest
     */
    lifetimeHours?: number;
    /**
     * 
     * @type {boolean}
     * @memberof ApiTokenUpdateRequest
     */
    disabled?: boolean;
}
/**
 * 
 * @export
 * @interface DatasetAccelerationError
 */
export interface DatasetAccelerationError {
    /**
     * 
     * @type {string}
     * @memberof DatasetAccelerationError
     */
    time: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetAccelerationError
     */
    errorText: string;
}
/**
 * 
 * @export
 * @interface DatasetAccelerationInfo
 */
export interface DatasetAccelerationInfo {
    /**
     * 
     * @type {DatasetAccelerationState}
     * @memberof DatasetAccelerationInfo
     */
    state: DatasetAccelerationState;
    /**
     * Live staleness of the dataset. Null if alwaysAccelerated is true.
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    stalenessSeconds: number | null;
    /**
     * A stable, conservative measurement of what staleness the dataset is achieving
     * over the past few hours. Null if alwaysAccelerated is true.
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    recentStalenessSeconds: number | null;
    /**
     * Reasons explaining why this dataset's freshness is what it is.
     * Empty array indicates the dataset is meeting its freshness goal.
     * Today the server returns at most one dominant reason; the list
     * shape is reserved so we can return multiple stacked reasons
     * (e.g. cost-throttle + decay together) in the future without an
     * API contract change.
     * 
     * @type {Array<DatasetStalenessReason>}
     * @memberof DatasetAccelerationInfo
     */
    stalenessReasons: Array<DatasetStalenessReason>;
    /**
     * User-configured staleness target of the dataset. Set to default value if not set by user.
     * Actual target may be higher due to decaying or credit manager overrides.
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    userConfiguredTargetStalenessSeconds: number | null;
    /**
     * Target staleness of the dataset, ignoring downstream freshness goals.
     * This can be higher than the configured staleness target due to decaying or credit manager overrides.
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    targetExcludingDownstreamStalenessSeconds: number | null;
    /**
     * Effective target staleness of the dataset. This is the value that the dataset is being kept up to date to.
     * This can be higher or lower than the user-configured target staleness if the credit manager is active or downstream datasets staleness targets demand it.
     * 
     * If `effectiveTargetStalenessSeconds > userConfiguredTargetStalenessSeconds`, then the credit manager is active on this dataset, and
     * `effectiveTargetStalenessSeconds == rateLimitOverrideTargetStalenessSeconds`.
     * If `effectiveTargetStalenessSeconds < userConfiguredTargetStalenessSeconds`, then a downstream dataset/monitor has a lower configured freshness goal.
     * If `effectiveTargetStalenessSeconds == userConfiguredTargetStalenessSeconds`, then the configured freshness goal is in effect.
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    effectiveTargetStalenessSeconds: number | null;
    /**
     * The target staleness override for this dataset from the credit manager, if
     * a transform credit rate limit is configured and is causing this dataset's
     * configured freshness goal to be overridden.
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    rateLimitOverrideTargetStalenessSeconds: number | null;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetAccelerationInfo
     */
    alwaysAccelerated: boolean;
    /**
     * 
     * @type {Array<OpenTimeRange>}
     * @memberof DatasetAccelerationInfo
     */
    acceleratedRanges: Array<OpenTimeRange>;
    /**
     * 
     * @type {Array<OpenTimeRange>}
     * @memberof DatasetAccelerationInfo
     */
    targetAcceleratedRanges: Array<OpenTimeRange>;
    /**
     * 
     * @type {string}
     * @memberof DatasetAccelerationInfo
     */
    freshnessTime: string | null;
    /**
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    effectiveOnDemandMaterializationLengthDays: number;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetAccelerationInfo
     */
    dataRetentionEnabled: boolean;
    /**
     * 
     * @type {number}
     * @memberof DatasetAccelerationInfo
     */
    effectiveDataRetentionPeriodDays: number | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetAccelerationInfo
     */
    effectiveDataRetentionTimestamp: string | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetAccelerationInfo
     */
    minimumDataTimestamp: string | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetAccelerationInfo
     */
    hibernatedAt: string | null;
    /**
     * 
     * @type {Array<DatasetAccelerationError>}
     * @memberof DatasetAccelerationInfo
     */
    errors: Array<DatasetAccelerationError>;
}


/**
 * The state of the dataset's acceleration.
 * Initializing: The dataset is newly created/updated and acceleration has just started.
 * Accelerated: The dataset is accelerated and available for querying.
 * AcceleratedImmediately: The dataset is accelerated and available for querying. The dataset is also in "live mode", meaning it is being updated as fast as possible.
 * Unavailable: The dataset is not accelerated and is not available for querying due to a compilation error in the dataset or upstream.
 * Disabled: The dataset is not accelerated and is available for querying due to user disablement. (e.g. dataset is a view)
 * Error: The dataset is not accelerated and may return outdated results due to a critical error.
 * 
 * @export
 * @enum {string}
 */
export enum DatasetAccelerationState {
    Initializing = 'Initializing',
    Accelerated = 'Accelerated',
    AcceleratedImmediately = 'AcceleratedImmediately',
    Unavailable = 'Unavailable',
    Disabled = 'Disabled',
    Error = 'Error'
}

/**
 * 
 * @export
 * @enum {string}
 */
export enum DatasetAccelerationType {
    InsertOnly = 'InsertOnly',
    Aggregation = 'Aggregation',
    Other = 'Other',
    NotSupported = 'NotSupported'
}

/**
 * 
 * @export
 * @interface DatasetAttributeStats
 */
export interface DatasetAttributeStats {
    /**
     * The attribute name that was queried
     * @type {string}
     * @memberof DatasetAttributeStats
     */
    attribute: string;
    /**
     * Total distinct values for this attribute (including those not in top-K)
     * @type {number}
     * @memberof DatasetAttributeStats
     */
    distinctCount: number;
    /**
     * Top-K value/count pairs, sorted by count descending
     * @type {Array<DatasetStatValueCount>}
     * @memberof DatasetAttributeStats
     */
    stats: Array<DatasetStatValueCount>;
}
/**
 * Brief record fields for a DatasetRef (label, description, iconUrl, contentType). Field naming mirrors ObjectBrief in this same file (iconUrl, not icon) for consistency across reference-brief pairs.
 * 
 * @export
 * @interface DatasetBrief
 */
export interface DatasetBrief {
    /**
     * 
     * @type {string}
     * @memberof DatasetBrief
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetBrief
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetBrief
     */
    iconUrl: string;
    /**
     * The type of data the referenced dataset contains — Resource, Log,
     * Metric, OTelSpan, OTelTrace, or Unknown. Derived from the dataset's
     * kind and interface bindings.
     * 
     * @type {DatasetContentType}
     * @memberof DatasetBrief
     */
    contentType: DatasetContentType;
}


/**
 * 
 * @export
 * @interface DatasetCompilationError
 */
export interface DatasetCompilationError {
    /**
     * 
     * @type {string}
     * @memberof DatasetCompilationError
     */
    error: string;
    /**
     * 
     * @type {DatasetRef}
     * @memberof DatasetCompilationError
     */
    errorInDataset: DatasetRef | null;
}
/**
 * The type of data a dataset contains. For Resource datasets, this is
 * determined by the dataset kind. For other kinds, it is derived from the
 * dataset's interface bindings. Returns Unknown if no recognized interface
 * is found.
 * 
 * @export
 * @enum {string}
 */
export enum DatasetContentType {
    Unknown = 'Unknown',
    Resource = 'Resource',
    Log = 'Log',
    Metric = 'Metric',
    OTelSpan = 'OTelSpan',
    OTelTrace = 'OTelTrace'
}

/**
 * 
 * @export
 * @interface DatasetCorrelationTag
 */
export interface DatasetCorrelationTag {
    /**
     * 
     * @type {string}
     * @memberof DatasetCorrelationTag
     */
    tag: string;
    /**
     * 
     * @type {DatasetFieldPath}
     * @memberof DatasetCorrelationTag
     */
    path: DatasetFieldPath;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum DatasetDataType {
    None = 'None',
    Bool = 'Bool',
    Float64 = 'Float64',
    Int64 = 'Int64',
    String = 'String',
    Timestamp = 'Timestamp',
    Duration = 'Duration',
    Ipv4 = 'IPv4',
    TDigest = 'TDigest',
    Array = 'Array',
    Object = 'Object',
    Variant = 'Variant',
    Link = 'Link',
    DatasetRef = 'DatasetRef'
}

/**
 * 
 * @export
 * @enum {string}
 */
export enum DatasetDatasetKind {
    Table = 'Table',
    Resource = 'Resource',
    Event = 'Event',
    Interval = 'Interval'
}

/**
 * The kind of dataset definition. Values match `metatypes.TransformKind`'s
 * string constants verbatim where the backend has one (`OPAL`, `Builtin`,
 * `LogDerived`); `Source` and `Invalid` are REST-side additions for
 * dataset shapes the backend does not surface as a TransformKind.
 * - OPAL: dataset is produced by an OPAL transform pipeline.
 * - Builtin: dataset is produced by a built-in transform (e.g. canonical-trace).
 * - LogDerived: dataset is a log-derived metric.
 * - Source: dataset receives data directly (datastream or external table); it has no transform.
 * - Invalid: the stored transform kind is empty or unrecognised. Indicates corrupt or partially-migrated data, or a legacy SQL-kind transform (no production datasets carry one as of 2026-05-14).
 * 
 * @export
 * @enum {string}
 */
export enum DatasetDefinitionType {
    Opal = 'OPAL',
    Builtin = 'Builtin',
    LogDerived = 'LogDerived',
    Source = 'Source',
    Invalid = 'Invalid'
}

/**
 * 
 * @export
 * @interface DatasetFieldDesc
 */
export interface DatasetFieldDesc {
    /**
     * 
     * @type {string}
     * @memberof DatasetFieldDesc
     */
    name: string;
    /**
     * 
     * @type {DatasetFieldType}
     * @memberof DatasetFieldDesc
     */
    type: DatasetFieldType;
    /**
     * 
     * @type {Array<DatasetIndexDefinition>}
     * @memberof DatasetFieldDesc
     */
    indexDefs: Array<DatasetIndexDefinition>;
    /**
     * 
     * @type {DatasetForeignKey}
     * @memberof DatasetFieldDesc
     */
    linkDesc: DatasetForeignKey | null;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetFieldDesc
     */
    isEnum: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetFieldDesc
     */
    isSearchable: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetFieldDesc
     */
    isHidden: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetFieldDesc
     */
    isConst: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetFieldDesc
     */
    isMetric: boolean;
}
/**
 * 
 * @export
 * @interface DatasetFieldPath
 */
export interface DatasetFieldPath {
    /**
     * 
     * @type {string}
     * @memberof DatasetFieldPath
     */
    field: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetFieldPath
     */
    path: string;
}
/**
 * 
 * @export
 * @interface DatasetFieldType
 */
export interface DatasetFieldType {
    /**
     * 
     * @type {DatasetDataType}
     * @memberof DatasetFieldType
     */
    tag: DatasetDataType;
}


/**
 * 
 * @export
 * @interface DatasetForeignKey
 */
export interface DatasetForeignKey {
    /**
     * 
     * @type {string}
     * @memberof DatasetForeignKey
     */
    label: string;
    /**
     * 
     * @type {DatasetRef}
     * @memberof DatasetForeignKey
     */
    targetDataset: DatasetRef | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetForeignKey
     */
    targetStageLabel: string | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetForeignKey
     */
    targetLabelField: string | null;
    /**
     * 
     * @type {Array<DatasetFieldPath>}
     * @memberof DatasetForeignKey
     */
    srcPaths: Array<DatasetFieldPath>;
    /**
     * 
     * @type {Array<string>}
     * @memberof DatasetForeignKey
     */
    dstFields: Array<string>;
}
/**
 * Response body for both GET /v1/datasets/graph and GET /v1/datasets/{id}/graph.
 * On the full-graph endpoint: datasets are sorted by id ascending, and meta.totalCount
 * is always the number of returned datasets (never -1).
 * On the focal endpoint: datasets are sorted in BFS-nearest order (focal first, then
 * by BFS depth, ties broken by id ascending for determinism), and meta.totalCount is
 * -1 iff the BFS was capped by limit; otherwise it is the number of returned datasets.
 * 
 * @export
 * @interface DatasetGraphResponse
 */
export interface DatasetGraphResponse {
    /**
     * 
     * @type {Array<DatasetGraphSummary>}
     * @memberof DatasetGraphResponse
     */
    datasets: Array<DatasetGraphSummary>;
    /**
     * 
     * @type {Meta}
     * @memberof DatasetGraphResponse
     */
    meta: Meta;
}
/**
 * Lean per-dataset projection used to render the Dataset Graph, Lineage tab,
 * and Explore Universe views. Intentionally a strict subset of Dataset-Resource:
 * only the fields required to render a graph node and its outgoing edges.
 * expand is not supported on graph endpoints.
 * 
 * NOTE: foreignKeyTargetIds and inputDatasetIds are returned as flat arrays of
 * id strings rather than the nested reference shape used elsewhere in this API.
 * This is a deliberate divergence from the REST Style Guide accepted for payload
 * size on the full-graph endpoint; these fields are not expandable.
 * 
 * @export
 * @interface DatasetGraphSummary
 */
export interface DatasetGraphSummary {
    /**
     * 
     * @type {string}
     * @memberof DatasetGraphSummary
     */
    readonly id: string;
    /**
     * Full dataset label (path/name).
     * @type {string}
     * @memberof DatasetGraphSummary
     */
    label: string;
    /**
     * 
     * @type {DatasetDatasetKind}
     * @memberof DatasetGraphSummary
     */
    kind: DatasetDatasetKind;
    /**
     * The content type (Resource, Log, Metric, OTelSpan, OTelTrace, Unknown).
     * Combined with kind to pick the dataset icon in the UI.
     * 
     * @type {DatasetContentType}
     * @memberof DatasetGraphSummary
     */
    contentType: DatasetContentType;
    /**
     * Explicit icon URL when set; null means the UI should derive from kind + contentType.
     * @type {string}
     * @memberof DatasetGraphSummary
     */
    icon: string | null;
    /**
     * 
     * @type {DatasetCompilationError}
     * @memberof DatasetGraphSummary
     */
    compilationError: DatasetCompilationError | null;
    /**
     * The dataset's current acceleration state, projected out of AccelerationInfo.
     * Exposed as a top-level scalar on this endpoint to avoid batch-loading the
     * full AccelerationInfo object.
     * 
     * @type {DatasetAccelerationState}
     * @memberof DatasetGraphSummary
     */
    accelerationState: DatasetAccelerationState;
    /**
     * Deduplicated list of foreign-key target dataset ids (forward edges only).
     * Self-references and targets pointing at datasets excluded by the default filter
     * are omitted.
     * 
     * @type {Array<string>}
     * @memberof DatasetGraphSummary
     */
    foreignKeyTargetIds: Array<string>;
    /**
     * Deduplicated list of dataset ids that feed this dataset via transform inputs
     * with InputRole=Data. Reference-role inputs are excluded.
     * 
     * @type {Array<string>}
     * @memberof DatasetGraphSummary
     */
    inputDatasetIds: Array<string>;
}


/**
 * 
 * @export
 * @interface DatasetGroupingElement
 */
export interface DatasetGroupingElement {
    /**
     * 
     * @type {DatasetGroupingElementType}
     * @memberof DatasetGroupingElement
     */
    type: DatasetGroupingElementType;
    /**
     * 
     * @type {string}
     * @memberof DatasetGroupingElement
     */
    value: string;
}


/**
 * 
 * @export
 * @enum {string}
 */
export enum DatasetGroupingElementType {
    Field = 'Field',
    Link = 'Link'
}

/**
 * 
 * @export
 * @interface DatasetGroupingKey
 */
export interface DatasetGroupingKey {
    /**
     * 
     * @type {Array<DatasetGroupingElement>}
     * @memberof DatasetGroupingKey
     */
    elements: Array<DatasetGroupingElement>;
}
/**
 * 
 * @export
 * @interface DatasetImplementedInterface
 */
export interface DatasetImplementedInterface {
    /**
     * 
     * @type {string}
     * @memberof DatasetImplementedInterface
     */
    path: string;
    /**
     * 
     * @type {Array<DatasetInterfaceFieldMapping>}
     * @memberof DatasetImplementedInterface
     */
    mapping: Array<DatasetInterfaceFieldMapping>;
}
/**
 * 
 * @export
 * @interface DatasetIndexDefinition
 */
export interface DatasetIndexDefinition {
    /**
     * 
     * @type {string}
     * @memberof DatasetIndexDefinition
     */
    field: string;
    /**
     * 
     * @type {DatasetIndexType}
     * @memberof DatasetIndexDefinition
     */
    type: DatasetIndexType;
}


/**
 * 
 * @export
 * @enum {string}
 */
export enum DatasetIndexType {
    TokenIndex = 'TokenIndex',
    SubstringIndex = 'SubstringIndex',
    EqualityIndex = 'EqualityIndex',
    AutoClusteringIndex = 'AutoClusteringIndex'
}

/**
 * 
 * @export
 * @interface DatasetInterfaceFieldMapping
 */
export interface DatasetInterfaceFieldMapping {
    /**
     * 
     * @type {string}
     * @memberof DatasetInterfaceFieldMapping
     */
    interfaceField: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetInterfaceFieldMapping
     */
    field: string;
}
/**
 * 
 * @export
 * @interface DatasetLegacyResource
 */
export interface DatasetLegacyResource {
    /**
     * 
     * @type {DatasetLegacyResourceMeta}
     * @memberof DatasetLegacyResource
     */
    meta: DatasetLegacyResourceMeta;
    /**
     * 
     * @type {DatasetLegacyResourceConfig}
     * @memberof DatasetLegacyResource
     */
    config: DatasetLegacyResourceConfig;
    /**
     * 
     * @type {DatasetLegacyResourceState}
     * @memberof DatasetLegacyResource
     */
    state: DatasetLegacyResourceState;
}
/**
 * Directly settable properties of the dataset.
 * @export
 * @interface DatasetLegacyResourceConfig
 */
export interface DatasetLegacyResourceConfig {
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceConfig
     */
    name: string;
}
/**
 * Metadata about the dataset.
 * @export
 * @interface DatasetLegacyResourceMeta
 */
export interface DatasetLegacyResourceMeta {
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceMeta
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceMeta
     */
    workspaceId: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceMeta
     */
    customerId: string;
}
/**
 * Implicitly derived state of the dataset.
 * @export
 * @interface DatasetLegacyResourceState
 */
export interface DatasetLegacyResourceState {
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceState
     */
    urlPath: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceState
     */
    kind: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceState
     */
    createdBy: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceState
     */
    createdDate: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceState
     */
    updatedBy: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceState
     */
    updatedDate: string;
    /**
     * 
     * @type {Array<DatasetLegacyResourceStateColumnsInner>}
     * @memberof DatasetLegacyResourceState
     */
    columns?: Array<DatasetLegacyResourceStateColumnsInner>;
    /**
     * 
     * @type {Array<DatasetLegacyResourceStateInterfacesInner>}
     * @memberof DatasetLegacyResourceState
     */
    interfaces?: Array<DatasetLegacyResourceStateInterfacesInner>;
}
/**
 * 
 * @export
 * @interface DatasetLegacyResourceStateColumnsInner
 */
export interface DatasetLegacyResourceStateColumnsInner {
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceStateColumnsInner
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceStateColumnsInner
     */
    type: string;
}
/**
 * 
 * @export
 * @interface DatasetLegacyResourceStateInterfacesInner
 */
export interface DatasetLegacyResourceStateInterfacesInner {
    /**
     * 
     * @type {string}
     * @memberof DatasetLegacyResourceStateInterfacesInner
     */
    path?: string;
    /**
     * 
     * @type {Array<object>}
     * @memberof DatasetLegacyResourceStateInterfacesInner
     */
    mapping?: Array<object>;
}
/**
 * 
 * @export
 * @interface DatasetListResponse
 */
export interface DatasetListResponse {
    /**
     * 
     * @type {Array<DatasetResource>}
     * @memberof DatasetListResponse
     */
    datasets: Array<DatasetResource>;
    /**
     * 
     * @type {Meta}
     * @memberof DatasetListResponse
     */
    meta: Meta;
}
/**
 * 
 * @export
 * @interface DatasetQueryFilterCreateRequest
 */
export interface DatasetQueryFilterCreateRequest {
    /**
     * Human-readable name for the filter
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    label: string;
    /**
     * Long-form description of the filter
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    description?: string;
    /**
     * Legacy OPAL boolean expression string for the filter predicate (without the leading `filter` verb).
     * 
     * Deprecated in favor of `pipeline` and may be removed in a future API version. Exactly one of `filter` or `pipeline` must be provided when creating a filter.
     * 
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    filter?: string;
    /**
     * Canonical OPAL pipeline snippet for the filter. May contain only filter verbs (and comments).
     * 
     * Exactly one of `filter` or `pipeline` must be provided when creating a filter. `pipeline` is preferred for new integrations, as `filter` may be removed in a future API version.
     * 
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    pipeline?: string;
    /**
     * Whether the filter is disabled by the user
     * @type {boolean}
     * @memberof DatasetQueryFilterCreateRequest
     */
    disabled?: boolean;
    /**
     * Activation window start time (inclusive). If omitted, the filter applies from negative infinity (unbounded from the past).
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    startTime?: string;
    /**
     * Activation window end time (exclusive). If omitted, the filter applies to positive infinity (unbounded to the future).
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    endTime?: string;
    /**
     * UI layout/metadata for the filter builder. This field is used by the Observe UI and should be omitted by other clients.
     * @type {string}
     * @memberof DatasetQueryFilterCreateRequest
     */
    layout?: string;
}
/**
 * 
 * @export
 * @interface DatasetQueryFilterResource
 */
export interface DatasetQueryFilterResource {
    /**
     * 
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    id: string;
    /**
     * Human-readable name for the filter
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    label: string;
    /**
     * Long-form description of the filter
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    description?: string;
    /**
     * Legacy OPAL boolean expression string for the filter predicate (without the leading `filter` verb).
     * 
     * Deprecated in favor of `pipeline` and may be removed in a future API version. When creating or updating a filter, clients must provide exactly one of `filter` or `pipeline`.
     * API responses always include both `filter` and `pipeline`; clients should consume `pipeline`.
     * 
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    filter: string;
    /**
     * Canonical OPAL pipeline snippet for the filter. May contain only filter verbs (and comments).
     * 
     * When creating or updating a filter, clients must provide exactly one of `filter` or `pipeline`.
     * API responses always include both `filter` and `pipeline`; clients should consume `pipeline`.
     * 
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    pipeline: string;
    /**
     * Whether the filter is disabled by the user
     * @type {boolean}
     * @memberof DatasetQueryFilterResource
     */
    disabled: boolean;
    /**
     * List of error messages if the filter has issues (omitted if no errors)
     * @type {Array<string>}
     * @memberof DatasetQueryFilterResource
     */
    errors?: Array<string>;
    /**
     * User who created the filter
     * @type {User}
     * @memberof DatasetQueryFilterResource
     */
    createdBy: User;
    /**
     * When the filter was created
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    createdAt: string;
    /**
     * User who last updated the filter
     * @type {User}
     * @memberof DatasetQueryFilterResource
     */
    updatedBy: User;
    /**
     * When the filter was last updated
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    updatedAt: string;
    /**
     * Activation window start time (inclusive). If omitted, the filter applies from negative infinity (unbounded from the past).
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    startTime?: string;
    /**
     * Activation window end time (exclusive). If omitted, the filter applies to positive infinity (unbounded to the future).
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    endTime?: string;
    /**
     * UI layout/metadata for the filter builder. This field is used by the Observe UI and should be omitted by other clients.
     * @type {string}
     * @memberof DatasetQueryFilterResource
     */
    layout?: string;
}
/**
 * 
 * @export
 * @interface DatasetQueryFilterUpdateRequest
 */
export interface DatasetQueryFilterUpdateRequest {
    /**
     * Human-readable name for the filter
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    label?: string;
    /**
     * Long-form description of the filter
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    description?: string | null;
    /**
     * Legacy OPAL boolean expression string for the filter predicate (without the leading `filter` verb).
     * 
     * Deprecated in favor of `pipeline` and may be removed in a future API version. When updating a filter's semantics, a request may provide either `filter` or `pipeline`, but not both.
     * 
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    filter?: string;
    /**
     * Canonical OPAL pipeline snippet for the filter. May contain only filter verbs (and comments).
     * 
     * When updating a filter's semantics, a request may provide either `filter` or `pipeline`, but not both. `pipeline` is preferred, as `filter` may be removed in a future API version.
     * 
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    pipeline?: string;
    /**
     * Whether the filter is disabled by the user
     * @type {boolean}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    disabled?: boolean;
    /**
     * Activation window start time (inclusive). If omitted, the filter applies from negative infinity (unbounded from the past).
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    startTime?: string | null;
    /**
     * Activation window end time (exclusive). If omitted, the filter applies to positive infinity (unbounded to the future).
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    endTime?: string | null;
    /**
     * UI layout/metadata for the filter builder. This field is used by the Observe UI and should be omitted by other clients.
     * @type {string}
     * @memberof DatasetQueryFilterUpdateRequest
     */
    layout?: string | null;
}
/**
 * A reference to a dataset. Always carries the id; the optional `record` field carries the brief metadata, populated when expand=true. Mirrors ObjectRef (see ObjectRef / ObjectBrief in this file).
 * 
 * @export
 * @interface DatasetRef
 */
export interface DatasetRef {
    /**
     * 
     * @type {string}
     * @memberof DatasetRef
     */
    id: string;
    /**
     * 
     * @type {DatasetBrief}
     * @memberof DatasetRef
     */
    record?: DatasetBrief;
}
/**
 * 
 * @export
 * @interface DatasetRelatedKey
 */
export interface DatasetRelatedKey {
    /**
     * 
     * @type {string}
     * @memberof DatasetRelatedKey
     */
    label: string;
    /**
     * 
     * @type {DatasetRef}
     * @memberof DatasetRelatedKey
     */
    targetDataset: DatasetRef;
    /**
     * 
     * @type {Array<string>}
     * @memberof DatasetRelatedKey
     */
    srcFields: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof DatasetRelatedKey
     */
    dstFields: Array<string>;
}
/**
 * Observe Dataset with properties.
 * @export
 * @interface DatasetResource
 */
export interface DatasetResource {
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    readonly id: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    icon: string;
    /**
     * 
     * @type {DatasetDatasetKind}
     * @memberof DatasetResource
     */
    kind: DatasetDatasetKind;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    source: string | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    lastUpdateSource: string | null;
    /**
     * 
     * @type {Array<DatasetFieldDesc>}
     * @memberof DatasetResource
     */
    fieldList: Array<DatasetFieldDesc>;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    validFromField: string | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    validToField: string | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    labelField: string | null;
    /**
     * 
     * @type {Array<string>}
     * @memberof DatasetResource
     */
    primaryKey: Array<string>;
    /**
     * 
     * @type {Array<Array<string>>}
     * @memberof DatasetResource
     */
    candidateKeys: Array<Array<string>>;
    /**
     * 
     * @type {Array<DatasetForeignKey>}
     * @memberof DatasetResource
     */
    foreignKeys: Array<DatasetForeignKey>;
    /**
     * 
     * @type {Array<DatasetRelatedKey>}
     * @memberof DatasetResource
     */
    relatedKeys: Array<DatasetRelatedKey>;
    /**
     * 
     * @type {DatasetGroupingKey}
     * @memberof DatasetResource
     */
    groupingKey: DatasetGroupingKey | null;
    /**
     * 
     * @type {Array<DatasetCorrelationTag>}
     * @memberof DatasetResource
     */
    correlationTags: Array<DatasetCorrelationTag>;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetResource
     */
    isSource: boolean;
    /**
     * 
     * @type {Array<DatasetImplementedInterface>}
     * @memberof DatasetResource
     */
    interfaces: Array<DatasetImplementedInterface>;
    /**
     * The type of data this dataset contains. For Resource datasets, determined by
     * the dataset kind. For other kinds, derived from the dataset's interface bindings.
     * Returns Unknown if no recognized interface is found.
     * 
     * @type {DatasetContentType}
     * @memberof DatasetResource
     */
    contentType: DatasetContentType;
    /**
     * Custom field mappings associated with the dataset's content type. Maps canonical
     * field names to column name(s). Most fields map to a single column, but some
     * (e.g. metric "tag") allow multiple columns. The exact set of keys depends on
     * the contentType. For example, a Log dataset might have {"log": ["message"]}, while
     * a Metric dataset might have {"metric": ["metric_name"], "value": ["metric_value"]}.
     * Empty if the dataset has no recognized content type.
     * 
     * @type {{ [key: string]: Array<string> | undefined; }}
     * @memberof DatasetResource
     */
    customFieldMappings: { [key: string]: Array<string> | undefined; };
    /**
     * User-defined tags categorizing this dataset, as a map of tag key to a list
     * of values. For example: {"env": ["prod", "staging"], "team": ["platform"]}.
     * Empty if the dataset has no tags.
     * 
     * @type {{ [key: string]: Array<string> | undefined; }}
     * @memberof DatasetResource
     */
    objectTags: { [key: string]: Array<string> | undefined; };
    /**
     * 
     * @type {DatasetTimeAlignment}
     * @memberof DatasetResource
     */
    alignment: DatasetTimeAlignment | null;
    /**
     * 
     * @type {DatasetCompilationError}
     * @memberof DatasetResource
     */
    compilationError: DatasetCompilationError | null;
    /**
     * 
     * @type {ObjectRef}
     * @memberof DatasetResource
     */
    managedBy: ObjectRef | null;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    dataTableViewState: string | null;
    /**
     * 
     * @type {ObjectRef}
     * @memberof DatasetResource
     */
    defaultDashboard: ObjectRef | null;
    /**
     * 
     * @type {ObjectRef}
     * @memberof DatasetResource
     */
    defaultInstanceDashboard: ObjectRef | null;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetResource
     */
    isView: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetResource
     */
    isMonitor: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof DatasetResource
     */
    isMetricSMA: boolean;
    /**
     * 
     * @type {DatasetAccelerationType}
     * @memberof DatasetResource
     */
    accelerationType: DatasetAccelerationType;
    /**
     * 
     * @type {DatasetAccelerationInfo}
     * @memberof DatasetResource
     */
    accelerationInfo: DatasetAccelerationInfo;
    /**
     * 
     * @type {User}
     * @memberof DatasetResource
     */
    createdBy: User;
    /**
     * 
     * @type {User}
     * @memberof DatasetResource
     */
    updatedBy: User;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    createdAt: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetResource
     */
    updatedAt: string;
    /**
     * 
     * @type {StorageIntegrationRef}
     * @memberof DatasetResource
     */
    readonly storageIntegration: StorageIntegrationRef | null;
    /**
     * The kind of definition that produces this dataset. Always populated;
     * classifies every dataset, including source datasets (datastreams /
     * external tables) and rows whose stored kind is empty or corrupt.
     * 
     * @type {DatasetDefinitionType}
     * @memberof DatasetResource
     */
    definitionType: DatasetDefinitionType;
    /**
     * Cosine similarity score (0–1). Only present when the `query` search
     * parameter is used (semantic search). Omitted for non-semantic list
     * requests.
     * 
     * @type {number}
     * @memberof DatasetResource
     */
    readonly score?: number;
}


/**
 * A reason explaining why a dataset's freshness is what it is.
 * ConfiguredFreshnessGoal: The user-configured freshness goal is the dominant factor.
 * CreditManagerOverride: A customer-level acceleration credit limit is forcing the freshness goal higher.
 * SlowAcceleration: The dataset is being de-prioritized because it has not been queried recently (decay).
 * ActiveBackfill: A backfill job is currently running for this dataset.
 * DatasetHibernated: The dataset is hibernated.
 * UnusedDatasetHibernating: The dataset is becoming hibernated due to lack of use.
 * 
 * @export
 * @enum {string}
 */
export enum DatasetStalenessReason {
    ConfiguredFreshnessGoal = 'ConfiguredFreshnessGoal',
    CreditManagerOverride = 'CreditManagerOverride',
    SlowAcceleration = 'SlowAcceleration',
    ActiveBackfill = 'ActiveBackfill',
    DatasetHibernated = 'DatasetHibernated',
    UnusedDatasetHibernating = 'UnusedDatasetHibernating'
}

/**
 * 
 * @export
 * @interface DatasetStatValueCount
 */
export interface DatasetStatValueCount {
    /**
     * The attribute value, always serialized as a JSON string regardless
     * of the attribute's CEL type. Strings appear verbatim; ints as
     * decimal digits (e.g. `"41000234"`); bools as `"true"` or
     * `"false"`; timestamps as RFC 3339 strings (e.g.
     * `"2024-01-01T00:00:00Z"`).
     * 
     * @type {string}
     * @memberof DatasetStatValueCount
     */
    value: string;
    /**
     * Number of datasets with this value
     * @type {number}
     * @memberof DatasetStatValueCount
     */
    count: number;
}
/**
 * 
 * @export
 * @interface DatasetStatsMeta
 */
export interface DatasetStatsMeta {
    /**
     * Total number of datasets before applying filter
     * @type {number}
     * @memberof DatasetStatsMeta
     */
    totalDatasets: number;
    /**
     * Number of datasets after applying filter (equal to totalDatasets when no filter)
     * @type {number}
     * @memberof DatasetStatsMeta
     */
    filteredDatasets: number;
}
/**
 * Aggregated stats for requested dataset attributes
 * @export
 * @interface DatasetStatsResponse
 */
export interface DatasetStatsResponse {
    /**
     * One entry per requested `attributes` expression, in request
     * order. Empty array if `attributes` was empty in the request.
     * 
     * @type {Array<DatasetAttributeStats>}
     * @memberof DatasetStatsResponse
     */
    attributes: Array<DatasetAttributeStats>;
    /**
     * One entry per requested `multiValueAttributes` expression, in
     * request order. Empty array if `multiValueAttributes` was empty in
     * the request. Each entry's `count` values are total
     * occurrences across all matching datasets and may exceed
     * `meta.filteredDatasets`.
     * 
     * @type {Array<DatasetAttributeStats>}
     * @memberof DatasetStatsResponse
     */
    multiValueAttributes: Array<DatasetAttributeStats>;
    /**
     * 
     * @type {DatasetStatsMeta}
     * @memberof DatasetStatsResponse
     */
    meta: DatasetStatsMeta;
}
/**
 * 
 * @export
 * @interface DatasetTimeAlignment
 */
export interface DatasetTimeAlignment {
    /**
     * 
     * @type {string}
     * @memberof DatasetTimeAlignment
     */
    stepSizeNanoseconds: string;
    /**
     * 
     * @type {string}
     * @memberof DatasetTimeAlignment
     */
    offsetNanoseconds: string;
}
/**
 * 
 * @export
 * @interface DocumentationSearchRequest
 */
export interface DocumentationSearchRequest {
    /**
     * Natural-language search query.
     * @type {string}
     * @memberof DocumentationSearchRequest
     */
    query: string;
    /**
     * Maximum number of results to return.
     * @type {number}
     * @memberof DocumentationSearchRequest
     */
    limit?: number;
    /**
     * Minimum cosine similarity score. Results below this threshold are excluded.
     * @type {number}
     * @memberof DocumentationSearchRequest
     */
    minScore?: number;
}
/**
 * 
 * @export
 * @interface DocumentationSearchResponse
 */
export interface DocumentationSearchResponse {
    /**
     * 
     * @type {Array<DocumentationSearchResult>}
     * @memberof DocumentationSearchResponse
     */
    documentation: Array<DocumentationSearchResult>;
    /**
     * 
     * @type {Meta}
     * @memberof DocumentationSearchResponse
     */
    meta: Meta;
}
/**
 * 
 * @export
 * @interface DocumentationSearchResult
 */
export interface DocumentationSearchResult {
    /**
     * Chunk title, typically the source document or section name.
     * @type {string}
     * @memberof DocumentationSearchResult
     */
    title: string;
    /**
     * The chunk's text content.
     * @type {string}
     * @memberof DocumentationSearchResult
     */
    text: string;
    /**
     * Link to the full documentation page on docs.observeinc.com, or null if unavailable.
     * @type {string}
     * @memberof DocumentationSearchResult
     */
    url?: string | null;
}
/**
 * 
 * @export
 * @interface ErrorMessage
 */
export interface ErrorMessage {
    /**
     * A stable, machine-readable identifier for the kind of error.
     * @type {string}
     * @memberof ErrorMessage
     */
    type: string;
    /**
     * Error message
     * @type {string}
     * @memberof ErrorMessage
     */
    message: string;
}
/**
 * 
 * @export
 * @interface ExportQueryRequest
 */
export interface ExportQueryRequest {
    /**
     * 
     * @type {ExportQueryRequestQuery}
     * @memberof ExportQueryRequest
     */
    query: ExportQueryRequestQuery;
    /**
     * The maximum number of rows to return. Defaults to 100,000, which is the maximum if paginate=false. If paginate=true rowCount can be up to the maximum value of int64 (9,223,372,036,854,775,807).
     * @type {string}
     * @memberof ExportQueryRequest
     */
    rowCount?: string;
    /**
     * 
     * @type {StagePresentationInput}
     * @memberof ExportQueryRequest
     */
    presentation?: StagePresentationInput;
}
/**
 * Encodes the actual OPAL query and its inputs.
 * @export
 * @interface ExportQueryRequestQuery
 */
export interface ExportQueryRequestQuery {
    /**
     * The name of the stage that will be used as output. Defaults to the last specified stage.
     * @type {string}
     * @memberof ExportQueryRequestQuery
     */
    outputStage?: string;
    /**
     * Describes one or more stage pipelines to execute. Stages can reference each other, but not in a cyclic fashion.
     * @type {Array<ExportQueryRequestQueryStagesInner>}
     * @memberof ExportQueryRequestQuery
     */
    stages: Array<ExportQueryRequestQueryStagesInner>;
    /**
     * Parameters defined for $variables (used for default values)
     * @type {Array<ParameterArrayInner>}
     * @memberof ExportQueryRequestQuery
     */
    parameters?: Array<ParameterArrayInner>;
    /**
     * Parameter values bound for $variables for this execution.
     * @type {Array<ParameterValueArrayInner>}
     * @memberof ExportQueryRequestQuery
     */
    parameterValues?: Array<ParameterValueArrayInner>;
}
/**
 * 
 * @export
 * @interface ExportQueryRequestQueryStagesInner
 */
export interface ExportQueryRequestQueryStagesInner {
    /**
     * Describes the @name bindings for input datasets or stages. The first input is provided as the default input to the pipeline.
     * @type {Array<InputDefinition>}
     * @memberof ExportQueryRequestQueryStagesInner
     */
    input: Array<InputDefinition>;
    /**
     * The ID to assign to this stage when binding as input to other datasets.
     * @type {string}
     * @memberof ExportQueryRequestQueryStagesInner
     */
    stageID: string;
    /**
     * The actual OPAL pipeline to execute. You can use embedded newlines,
     * or the pipe | character to separate verb clauses. You can include
     * embedded sub-queries, too.
     * 
     * @type {string}
     * @memberof ExportQueryRequestQueryStagesInner
     */
    pipeline: string;
    /**
     * Parameters defined for $variables (used for default values)
     * @type {Array<ParameterArrayInner>}
     * @memberof ExportQueryRequestQueryStagesInner
     */
    parameters?: Array<ParameterArrayInner>;
    /**
     * Parameter values bound for $variables for this execution.
     * @type {Array<ParameterValueArrayInner>}
     * @memberof ExportQueryRequestQueryStagesInner
     */
    parameterValues?: Array<ParameterValueArrayInner>;
}
/**
 * 
 * @export
 * @interface GenerateAPITokenRequest
 */
export interface GenerateAPITokenRequest {
    /**
     * The email address of the user to mint credentials for.
     * @type {string}
     * @memberof GenerateAPITokenRequest
     */
    userEmail: string;
    /**
     * The password of the user minting credentials.
     * @type {string}
     * @memberof GenerateAPITokenRequest
     */
    userPassword: string;
    /**
     * Optional name of the token, to remember what it is for.
     * @type {string}
     * @memberof GenerateAPITokenRequest
     */
    tokenName?: string;
}
/**
 * 
 * @export
 * @interface GetDatasetById200Response
 */
export interface GetDatasetById200Response {
    /**
     * 
     * @type {boolean}
     * @memberof GetDatasetById200Response
     */
    ok?: boolean;
    /**
     * 
     * @type {DatasetLegacyResource}
     * @memberof GetDatasetById200Response
     */
    data?: DatasetLegacyResource;
}
/**
 * 
 * @export
 * @interface InputDefinition
 */
export interface InputDefinition {
    /**
     * The @name used to reference this input in OPAL (without the @ sign)
     * @type {string}
     * @memberof InputDefinition
     */
    inputName: string;
    /**
     * Data or Reference, defaults to Data if not specified.
     * @type {string}
     * @memberof InputDefinition
     */
    inputRole?: string;
    /**
     * The dataset ID (as int64-string) to bind to this name.
     * @type {string}
     * @memberof InputDefinition
     */
    datasetId?: string;
    /**
     * The dataset name as Workspace.path/Name to bind to this name, if not using datasetId.
     * @type {string}
     * @memberof InputDefinition
     */
    datasetPath?: string;
    /**
     * The stageID of the previously defined stage to reference, if it's a stage and not a dataset.
     * @type {string}
     * @memberof InputDefinition
     */
    stageId?: string;
    /**
     * The parameter ID to take the input dataset reference from. (Advanced usage only)
     * @type {string}
     * @memberof InputDefinition
     */
    parameterId?: string;
}
/**
 * 
 * @export
 * @interface ListDatasetQueryFilters200Response
 */
export interface ListDatasetQueryFilters200Response {
    /**
     * 
     * @type {Array<DatasetQueryFilterResource>}
     * @memberof ListDatasetQueryFilters200Response
     */
    queryFilters: Array<DatasetQueryFilterResource>;
    /**
     * 
     * @type {Meta}
     * @memberof ListDatasetQueryFilters200Response
     */
    meta: Meta;
}
/**
 * 
 * @export
 * @interface ListDatasetsResponse
 */
export interface ListDatasetsResponse {
    /**
     * 
     * @type {boolean}
     * @memberof ListDatasetsResponse
     */
    ok?: boolean;
    /**
     * 
     * @type {Array<DatasetLegacyResource>}
     * @memberof ListDatasetsResponse
     */
    data?: Array<DatasetLegacyResource>;
}
/**
 * List Response Metadata
 * @export
 * @interface Meta
 */
export interface Meta {
    /**
     * The total number of resources available, independent of pagination.
     * The API may return -1 if the total count is unknown or cannot be computed
     * in reasonable time.
     * 
     * @type {number}
     * @memberof Meta
     */
    totalCount: number;
}
/**
 * Brief monitor metadata included when a reference is expanded.
 * @export
 * @interface MonitorBrief
 */
export interface MonitorBrief {
    /**
     * The monitor's display label.
     * @type {string}
     * @memberof MonitorBrief
     */
    label: string;
    /**
     * The monitor's description. Null when no description is configured.
     * @type {string}
     * @memberof MonitorBrief
     */
    description: string | null;
}
/**
 * 
 * @export
 * @interface MonitorMuteCreateRequest
 */
export interface MonitorMuteCreateRequest {
    /**
     * 
     * @type {string}
     * @memberof MonitorMuteCreateRequest
     */
    label: string;
    /**
     * Free-form description. Omit to leave blank.
     * @type {string}
     * @memberof MonitorMuteCreateRequest
     */
    description?: string;
    /**
     * 
     * @type {MonitorMuteTargetInput}
     * @memberof MonitorMuteCreateRequest
     */
    target: MonitorMuteTargetInput;
    /**
     * 
     * @type {MonitorMuteScheduleInput}
     * @memberof MonitorMuteCreateRequest
     */
    schedule: MonitorMuteScheduleInput;
    /**
     * CEL boolean expression evaluated against each fired alarm row. Required and non-empty when `target.kind` is `Global` (prevents accidental fleet-wide suppression). When `target.kind` is `Monitors`, omit to suppress all firings for those monitors unconditionally. Example: `level == "Critical" && context["service"] == "payments"`.
     * 
     * @type {string}
     * @memberof MonitorMuteCreateRequest
     */
    filter?: string;
}
/**
 * 
 * @export
 * @interface MonitorMuteCronSchedule
 */
export interface MonitorMuteCronSchedule {
    /**
     * POSIX 5-field cron expression (`minute hour day-of-month month day-of-week`). No seconds field, no year field, no Quartz extensions, no `@daily`-style macros. Fields support `*` (any), `,` (list), `-` (range), and `/` (step). The server rejects expressions outside this dialect with `invalid_schedule`. Examples: `0 2 * * *` (daily at 02:00), `0 9-17 * * 1-5` (every hour 09:00–17:00 Mon–Fri), `0-59/15 * * * *` (every 15 min).
     * 
     * @type {string}
     * @memberof MonitorMuteCronSchedule
     */
    rawCron: string;
    /**
     * IANA timezone name. Example: "America/Los_Angeles".
     * @type {string}
     * @memberof MonitorMuteCronSchedule
     */
    timezone: string;
}
/**
 * 
 * @export
 * @interface MonitorMuteListResponse
 */
export interface MonitorMuteListResponse {
    /**
     * 
     * @type {Array<MonitorMuteResource>}
     * @memberof MonitorMuteListResponse
     */
    monitorMutes: Array<MonitorMuteResource>;
    /**
     * 
     * @type {Meta}
     * @memberof MonitorMuteListResponse
     */
    meta: Meta;
}
/**
 * A one-time mute window. Always fully populated in responses.
 * @export
 * @interface MonitorMuteOneTime
 */
export interface MonitorMuteOneTime {
    /**
     * Start of the mute window.
     * @type {string}
     * @memberof MonitorMuteOneTime
     */
    startTime: string;
    /**
     * End of the mute window. `null` means until manually deleted.
     * @type {string}
     * @memberof MonitorMuteOneTime
     */
    endTime: string | null;
}
/**
 * Input shape for a one-time schedule. `startTime` is required. Omit `endTime` or pass `null` to create an open-ended mute.
 * 
 * @export
 * @interface MonitorMuteOneTimeInput
 */
export interface MonitorMuteOneTimeInput {
    /**
     * Start of the mute window.
     * @type {string}
     * @memberof MonitorMuteOneTimeInput
     */
    startTime: string;
    /**
     * End of the mute window. Omit or pass `null` for open-ended.
     * @type {string}
     * @memberof MonitorMuteOneTimeInput
     */
    endTime?: string | null;
}
/**
 * A recurring mute window driven by a cron schedule.
 * @export
 * @interface MonitorMuteRecurring
 */
export interface MonitorMuteRecurring {
    /**
     * 
     * @type {MonitorMuteCronSchedule}
     * @memberof MonitorMuteRecurring
     */
    cronSchedule: MonitorMuteCronSchedule;
    /**
     * Wall-clock length of each fired window in seconds. Must be at least 1.
     * @type {number}
     * @memberof MonitorMuteRecurring
     */
    durationSeconds: number;
}
/**
 * Input shape for a recurring schedule. Mirrors `MonitorMute-Recurring`; kept separate so server-computed response fields can be added to the response type without widening the write contract.
 * 
 * @export
 * @interface MonitorMuteRecurringInput
 */
export interface MonitorMuteRecurringInput {
    /**
     * 
     * @type {MonitorMuteCronSchedule}
     * @memberof MonitorMuteRecurringInput
     */
    cronSchedule: MonitorMuteCronSchedule;
    /**
     * Wall-clock length of each fired window in seconds. Must be at least 1.
     * @type {number}
     * @memberof MonitorMuteRecurringInput
     */
    durationSeconds: number;
}
/**
 * A mute rule suppresses alert notifications during a defined time window. Use `target.kind: Global` to mute all monitors, or `target.kind: Monitors` to target a specific set.
 * 
 * @export
 * @interface MonitorMuteResource
 */
export interface MonitorMuteResource {
    /**
     * 
     * @type {string}
     * @memberof MonitorMuteResource
     */
    id: string;
    /**
     * Human-readable name for this mute rule.
     * @type {string}
     * @memberof MonitorMuteResource
     */
    label: string;
    /**
     * Free-form description. `null` when unset.
     * @type {string}
     * @memberof MonitorMuteResource
     */
    description: string | null;
    /**
     * 
     * @type {MonitorMuteTarget}
     * @memberof MonitorMuteResource
     */
    target: MonitorMuteTarget;
    /**
     * 
     * @type {MonitorMuteSchedule}
     * @memberof MonitorMuteResource
     */
    schedule: MonitorMuteSchedule;
    /**
     * Optional CEL boolean expression evaluated against each fired alarm row at notification time. `null` means every firing is suppressed. Required and non-empty when `target.kind` is `Global` to prevent accidental fleet-wide suppression. Example: `level == "Critical" && context["service"] == "payments"`.
     * 
     * @type {string}
     * @memberof MonitorMuteResource
     */
    filter: string | null;
    /**
     * Computed start of the current or next active window. For `OneTime` schedules this mirrors `schedule.oneTime.startTime`. For `Recurring` schedules this is the next computed firing time. `null` between recurring windows.
     * 
     * @type {string}
     * @memberof MonitorMuteResource
     */
    startTime: string | null;
    /**
     * Computed end of the current or next active window. For `OneTime` schedules this mirrors `schedule.oneTime.endTime` (`null` for open-ended mutes). For `Recurring` schedules this is `startTime + durationSeconds`.
     * 
     * @type {string}
     * @memberof MonitorMuteResource
     */
    endTime: string | null;
    /**
     * 
     * @type {User}
     * @memberof MonitorMuteResource
     */
    createdBy: User;
    /**
     * 
     * @type {string}
     * @memberof MonitorMuteResource
     */
    createdAt: string;
    /**
     * 
     * @type {User}
     * @memberof MonitorMuteResource
     */
    updatedBy: User;
    /**
     * 
     * @type {string}
     * @memberof MonitorMuteResource
     */
    updatedAt: string;
}
/**
 * Discriminated schedule. Both `oneTime` and `recurring` are always present in responses; the inactive sibling is `null`.
 * 
 * @export
 * @interface MonitorMuteSchedule
 */
export interface MonitorMuteSchedule {
    /**
     * 
     * @type {MonitorMuteScheduleKind}
     * @memberof MonitorMuteSchedule
     */
    kind: MonitorMuteScheduleKind;
    /**
     * 
     * @type {MonitorMuteOneTime}
     * @memberof MonitorMuteSchedule
     */
    oneTime: MonitorMuteOneTime | null;
    /**
     * 
     * @type {MonitorMuteRecurring}
     * @memberof MonitorMuteSchedule
     */
    recurring: MonitorMuteRecurring | null;
}


/**
 * Input shape for a schedule. `kind` is required; send only the sibling matching `kind` (`oneTime` or `recurring`).
 * 
 * @export
 * @interface MonitorMuteScheduleInput
 */
export interface MonitorMuteScheduleInput {
    /**
     * 
     * @type {MonitorMuteScheduleKind}
     * @memberof MonitorMuteScheduleInput
     */
    kind: MonitorMuteScheduleKind;
    /**
     * 
     * @type {MonitorMuteOneTimeInput}
     * @memberof MonitorMuteScheduleInput
     */
    oneTime?: MonitorMuteOneTimeInput;
    /**
     * 
     * @type {MonitorMuteRecurringInput}
     * @memberof MonitorMuteScheduleInput
     */
    recurring?: MonitorMuteRecurringInput;
}


/**
 * `OneTime` defines a fixed window with an explicit start and optional end. `Recurring` fires on a cron schedule for a specified duration.
 * 
 * @export
 * @enum {string}
 */
export enum MonitorMuteScheduleKind {
    OneTime = 'OneTime',
    Recurring = 'Recurring'
}

/**
 * Describes which monitors this mute rule applies to. `monitors` is always present: empty when `kind` is `Global`, non-empty when `kind` is `Monitors`.
 * 
 * @export
 * @interface MonitorMuteTarget
 */
export interface MonitorMuteTarget {
    /**
     * 
     * @type {MonitorMuteTargetKind}
     * @memberof MonitorMuteTarget
     */
    kind: MonitorMuteTargetKind;
    /**
     * 
     * @type {Array<MonitorRef>}
     * @memberof MonitorMuteTarget
     */
    monitors: Array<MonitorRef>;
}


/**
 * Input shape for a mute target. `kind` is optional in PATCH — if provided it must match the existing value since `kind` is immutable after creation. `monitors` is required and non-empty when `kind` is `Monitors`; omit or leave empty when `kind` is `Global`.
 * 
 * @export
 * @interface MonitorMuteTargetInput
 */
export interface MonitorMuteTargetInput {
    /**
     * 
     * @type {MonitorMuteTargetKind}
     * @memberof MonitorMuteTargetInput
     */
    kind?: MonitorMuteTargetKind;
    /**
     * 
     * @type {Array<MonitorRef>}
     * @memberof MonitorMuteTargetInput
     */
    monitors?: Array<MonitorRef>;
}


/**
 * `Global` suppresses all monitors (requires a non-empty `filter`). `Monitors` targets a specific set of monitors by ID.
 * 
 * @export
 * @enum {string}
 */
export enum MonitorMuteTargetKind {
    Global = 'Global',
    Monitors = 'Monitors'
}

/**
 * All fields are optional. Omitted fields are left unchanged. Sending a `target` object replaces the entire target subtree atomically; `target.kind` must match the existing value (it is immutable). Send `filter: null` to remove an existing filter.
 * 
 * @export
 * @interface MonitorMuteUpdateRequest
 */
export interface MonitorMuteUpdateRequest {
    /**
     * 
     * @type {string}
     * @memberof MonitorMuteUpdateRequest
     */
    label?: string;
    /**
     * Pass `null` to clear the description.
     * @type {string}
     * @memberof MonitorMuteUpdateRequest
     */
    description?: string | null;
    /**
     * 
     * @type {MonitorMuteTargetInput}
     * @memberof MonitorMuteUpdateRequest
     */
    target?: MonitorMuteTargetInput;
    /**
     * 
     * @type {MonitorMuteScheduleInput}
     * @memberof MonitorMuteUpdateRequest
     */
    schedule?: MonitorMuteScheduleInput;
    /**
     * Pass `null` to remove an existing filter.
     * @type {string}
     * @memberof MonitorMuteUpdateRequest
     */
    filter?: string | null;
}
/**
 * Reference to a monitor. Always carries the `id`. The `record` field is
 * populated with brief metadata only when `expand=true`.
 * 
 * @export
 * @interface MonitorRef
 */
export interface MonitorRef {
    /**
     * 
     * @type {string}
     * @memberof MonitorRef
     */
    id: string;
    /**
     * 
     * @type {MonitorBrief}
     * @memberof MonitorRef
     */
    record?: MonitorBrief;
}
/**
 * 
 * @export
 * @interface MonitorV2
 */
export interface MonitorV2 {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2
     */
    readonly id: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2
     */
    name: string;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2
     */
    readonly disabled?: boolean;
    /**
     * 
     * @type {MonitorV2RuleKind}
     * @memberof MonitorV2
     */
    ruleKind: MonitorV2RuleKind;
    /**
     * 
     * @type {MonitorV2Definition}
     * @memberof MonitorV2
     */
    definition: MonitorV2Definition;
    /**
     * 
     * @type {Array<MonitorV2ActionRule>}
     * @memberof MonitorV2
     */
    actionRules?: Array<MonitorV2ActionRule>;
    /**
     * The resolved scheduling mode the monitor is actually using, as determined by the backend. Always populated on GET responses. This may differ from definition.scheduling, which only reflects what the user explicitly configured. Ignored on POST/PATCH.
     * 
     * @type {MonitorV2Scheduling}
     * @memberof MonitorV2
     */
    readonly effectiveScheduling?: MonitorV2Scheduling;
}


/**
 * 
 * @export
 * @interface MonitorV2ActionDefinition
 */
export interface MonitorV2ActionDefinition {
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2ActionDefinition
     */
    inline?: boolean;
    /**
     * 
     * @type {MonitorV2ActionType}
     * @memberof MonitorV2ActionDefinition
     */
    type?: MonitorV2ActionType;
    /**
     * 
     * @type {MonitorV2EmailAction}
     * @memberof MonitorV2ActionDefinition
     */
    email?: MonitorV2EmailAction;
    /**
     * 
     * @type {MonitorV2WebhookAction}
     * @memberof MonitorV2ActionDefinition
     */
    webhook?: MonitorV2WebhookAction;
}


/**
 * Either the actionId or the definition must be present when setting.
 * The actionId references an existing shared action, while the
 * definition would be used to configure an inline (private to a monitor)
 * action.
 * 
 * @export
 * @interface MonitorV2ActionRule
 */
export interface MonitorV2ActionRule {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2ActionRule
     */
    actionId?: string;
    /**
     * 
     * @type {MonitorV2AlarmLevel}
     * @memberof MonitorV2ActionRule
     */
    levels?: MonitorV2AlarmLevel;
    /**
     * 
     * @type {MonitorV2ComparisonExpression}
     * @memberof MonitorV2ActionRule
     */
    conditions?: MonitorV2ComparisonExpression;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2ActionRule
     */
    sendEndNotifications?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2ActionRule
     */
    sendRemindersInterval?: boolean;
    /**
     * 
     * @type {MonitorV2ActionDefinition}
     * @memberof MonitorV2ActionRule
     */
    definition?: MonitorV2ActionDefinition;
}


/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2ActionType {
    Email = 'Email',
    PagerDuty = 'PagerDuty',
    Slack = 'Slack',
    Webhook = 'Webhook'
}

/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2AlarmLevel {
    Critical = 'Critical',
    Error = 'Error',
    Informational = 'Informational',
    None = 'None',
    Warning = 'Warning'
}

/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2BooleanOperator {
    And = 'And',
    Or = 'Or'
}

/**
 * Identifies a column in a monitor's input pipeline. At most one of
 * `linkColumn`, `columnPath`, and `correlationTag` may be set; the
 * save-time validator rejects violations of this one-of contract.
 * 
 * @export
 * @interface MonitorV2Column
 */
export interface MonitorV2Column {
    /**
     * 
     * @type {MonitorV2LinkColumn}
     * @memberof MonitorV2Column
     */
    linkColumn?: MonitorV2LinkColumn;
    /**
     * 
     * @type {MonitorV2ColumnPath}
     * @memberof MonitorV2Column
     */
    columnPath?: MonitorV2ColumnPath;
    /**
     * 
     * @type {MonitorV2CorrelationTag}
     * @memberof MonitorV2Column
     */
    correlationTag?: MonitorV2CorrelationTag;
}
/**
 * 
 * @export
 * @interface MonitorV2ColumnComparison
 */
export interface MonitorV2ColumnComparison {
    /**
     * 
     * @type {Array<MonitorV2Comparison>}
     * @memberof MonitorV2ColumnComparison
     */
    compareValues?: Array<MonitorV2Comparison>;
    /**
     * 
     * @type {MonitorV2Column}
     * @memberof MonitorV2ColumnComparison
     */
    column?: MonitorV2Column;
}
/**
 * 
 * @export
 * @interface MonitorV2ColumnPath
 */
export interface MonitorV2ColumnPath {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2ColumnPath
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2ColumnPath
     */
    path?: string;
}
/**
 * 
 * @export
 * @interface MonitorV2Comparison
 */
export interface MonitorV2Comparison {
    /**
     * 
     * @type {MonitorV2ComparisonFunction}
     * @memberof MonitorV2Comparison
     */
    compareFn?: MonitorV2ComparisonFunction;
    /**
     * 
     * @type {PrimitiveValue}
     * @memberof MonitorV2Comparison
     */
    compareValue?: PrimitiveValue;
}


/**
 * 
 * @export
 * @interface MonitorV2ComparisonExpression
 */
export interface MonitorV2ComparisonExpression {
    /**
     * 
     * @type {MonitorV2BooleanOperator}
     * @memberof MonitorV2ComparisonExpression
     */
    operator?: MonitorV2BooleanOperator;
    /**
     * 
     * @type {Array<MonitorV2ComparisonExpression>}
     * @memberof MonitorV2ComparisonExpression
     */
    subExpressions?: Array<MonitorV2ComparisonExpression>;
    /**
     * 
     * @type {Array<MonitorV2ComparisonTerm>}
     * @memberof MonitorV2ComparisonExpression
     */
    compareTerms?: Array<MonitorV2ComparisonTerm>;
}


/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2ComparisonFunction {
    Contains = 'Contains',
    Equal = 'Equal',
    Greater = 'Greater',
    GreaterOrEqual = 'GreaterOrEqual',
    Less = 'Less',
    LessOrEqual = 'LessOrEqual',
    NotContains = 'NotContains',
    NotEqual = 'NotEqual',
    NotStartsWith = 'NotStartsWith',
    StartsWith = 'StartsWith'
}

/**
 * 
 * @export
 * @interface MonitorV2ComparisonTerm
 */
export interface MonitorV2ComparisonTerm {
    /**
     * 
     * @type {MonitorV2Comparison}
     * @memberof MonitorV2ComparisonTerm
     */
    comparison: MonitorV2Comparison;
    /**
     * 
     * @type {MonitorV2Column}
     * @memberof MonitorV2ComparisonTerm
     */
    column: MonitorV2Column;
}
/**
 * Marker on a `MonitorV2Column` indicating that the column is grouping by a
 * correlation tag (e.g. `service.name`) rather than a specific physical
 * column. The per-column struct is a slim marker that only carries the tag
 * name; the resolved `(tag, backing-column)` mapping for every correlation
 * tag in the schema lives on `MonitorV2AlertSchema.correlationTags`, which
 * is the single source of truth for tag-to-column resolution.
 * 
 * @export
 * @interface MonitorV2CorrelationTag
 */
export interface MonitorV2CorrelationTag {
    /**
     * Correlation tag name, without the leading `#`. The save-time resolver
     * expands this into the canonical primary backing column picked by the
     * OPAL coalesce ordering and records the `(tag, column)` pair on
     * `MonitorV2AlertSchema.correlationTags`; this column itself carries
     * only the tag identifier.
     * 
     * @type {string}
     * @memberof MonitorV2CorrelationTag
     */
    tag?: string;
}
/**
 * 
 * @export
 * @interface MonitorV2CountRule
 */
export interface MonitorV2CountRule {
    /**
     * 
     * @type {Array<MonitorV2Comparison>}
     * @memberof MonitorV2CountRule
     */
    compareValues: Array<MonitorV2Comparison>;
    /**
     * 
     * @type {Array<MonitorV2ColumnComparison>}
     * @memberof MonitorV2CountRule
     */
    compareGroups?: Array<MonitorV2ColumnComparison>;
}
/**
 * 
 * @export
 * @interface MonitorV2CronSchedule
 */
export interface MonitorV2CronSchedule {
    /**
     * Crontab configuration for wall-clock scheduled evaluation.
     * @type {string}
     * @memberof MonitorV2CronSchedule
     */
    cronConfig?: string;
    /**
     * IANA timezone for interpreting cronConfig on the wall clock.
     * @type {string}
     * @memberof MonitorV2CronSchedule
     */
    timezone: string;
    /**
     * 
     * @type {MonitorV2CronScheduleAlarmMode}
     * @memberof MonitorV2CronSchedule
     */
    alarmMode?: MonitorV2CronScheduleAlarmMode;
}


/**
 * Controls how alarms are emitted across consecutive monitor evaluations. PerRun (the default when omitted) emits an independent zero-duration alarm per firing evaluation. Ongoing causes consecutive evaluations that re-assert the same (group, level) to extend a single ongoing alarm. Setting the value to Ongoing is gated by a customer feature flag.
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2CronScheduleAlarmMode {
    PerRun = 'PerRun',
    Ongoing = 'Ongoing'
}

/**
 * 
 * @export
 * @interface MonitorV2Definition
 */
export interface MonitorV2Definition {
    /**
     * 
     * @type {MultiStageQuery}
     * @memberof MonitorV2Definition
     */
    inputQuery: MultiStageQuery;
    /**
     * 
     * @type {Array<MonitorV2Rule>}
     * @memberof MonitorV2Definition
     */
    rules: Array<MonitorV2Rule>;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2Definition
     */
    lookbackTime?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2Definition
     */
    dataStabilizationDelay?: string;
    /**
     * 
     * @type {number}
     * @memberof MonitorV2Definition
     */
    maxAlertsPerHour?: number;
    /**
     * 
     * @type {Array<MonitorV2Column>}
     * @memberof MonitorV2Definition
     */
    groupings?: Array<MonitorV2Column>;
    /**
     * User-specified scheduling preference. When read back via GET, this reflects only what the user explicitly set, not the scheduling mode the backend is actually using. Null or omitted means the system chooses the best mode automatically. To see the resolved scheduling mode, use the top-level effectiveScheduling field instead.
     * 
     * @type {MonitorV2Scheduling}
     * @memberof MonitorV2Definition
     */
    scheduling?: MonitorV2Scheduling;
}
/**
 * 
 * @export
 * @interface MonitorV2EmailAction
 */
export interface MonitorV2EmailAction {
    /**
     * 
     * @type {Array<string>}
     * @memberof MonitorV2EmailAction
     */
    users?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof MonitorV2EmailAction
     */
    addresses?: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2EmailAction
     */
    subject: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2EmailAction
     */
    body?: string;
    /**
     * 
     * @type {object}
     * @memberof MonitorV2EmailAction
     */
    fragments?: object;
}
/**
 * The http type describes the method or verb to use in http webhooks.
 * note: As a convenience, the values POST and PUT will be accepted, but converted
 * to the enumeration values Post and Put respectively.
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2HttpType {
    Post = 'Post',
    Put = 'Put'
}

/**
 * 
 * @export
 * @interface MonitorV2LinkColumn
 */
export interface MonitorV2LinkColumn {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2LinkColumn
     */
    name?: string;
    /**
     * 
     * @type {MonitorV2LinkColumnMeta}
     * @memberof MonitorV2LinkColumn
     */
    meta?: MonitorV2LinkColumnMeta;
}
/**
 * 
 * @export
 * @interface MonitorV2LinkColumnMeta
 */
export interface MonitorV2LinkColumnMeta {
    /**
     * 
     * @type {Array<MonitorV2ColumnPath>}
     * @memberof MonitorV2LinkColumnMeta
     */
    srcFields?: Array<MonitorV2ColumnPath>;
    /**
     * 
     * @type {Array<string>}
     * @memberof MonitorV2LinkColumnMeta
     */
    dstFields?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof MonitorV2LinkColumnMeta
     */
    targetDataset?: Array<string>;
}
/**
 * 
 * @export
 * @interface MonitorV2MuteRule
 */
export interface MonitorV2MuteRule {
    /**
     * 
     * @type {MonitorV2MuteRuleSchedule}
     * @memberof MonitorV2MuteRule
     */
    schedule: MonitorV2MuteRuleSchedule;
    /**
     * 
     * @type {MonitorV2ComparisonExpression}
     * @memberof MonitorV2MuteRule
     */
    criteria?: MonitorV2ComparisonExpression;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRule
     */
    readonly validFrom: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRule
     */
    readonly validTo?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRule
     */
    monitorID?: string;
    /**
     * 
     * @type {MonitorV2MuteRuleMonitor}
     * @memberof MonitorV2MuteRule
     */
    monitor?: MonitorV2MuteRuleMonitor;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRule
     */
    readonly id: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRule
     */
    name: string;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2MuteRule
     */
    readonly isGlobal?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2MuteRule
     */
    readonly isConditional?: boolean;
}
/**
 * 
 * @export
 * @interface MonitorV2MuteRuleMonitor
 */
export interface MonitorV2MuteRuleMonitor {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleMonitor
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleMonitor
     */
    name?: string;
}
/**
 * 
 * @export
 * @interface MonitorV2MuteRuleSchedule
 */
export interface MonitorV2MuteRuleSchedule {
    /**
     * 
     * @type {MonitorV2MuteScheduleType}
     * @memberof MonitorV2MuteRuleSchedule
     */
    type: MonitorV2MuteScheduleType;
    /**
     * 
     * @type {MonitorV2OneTimeMuteSchedule}
     * @memberof MonitorV2MuteRuleSchedule
     */
    oneTime?: MonitorV2OneTimeMuteSchedule;
}


/**
 * 
 * @export
 * @interface MonitorV2MuteRuleScheduleTerse
 */
export interface MonitorV2MuteRuleScheduleTerse {
    /**
     * 
     * @type {MonitorV2MuteScheduleType}
     * @memberof MonitorV2MuteRuleScheduleTerse
     */
    type: MonitorV2MuteScheduleType;
}


/**
 * 
 * @export
 * @interface MonitorV2MuteRuleTerse
 */
export interface MonitorV2MuteRuleTerse {
    /**
     * 
     * @type {MonitorV2MuteRuleScheduleTerse}
     * @memberof MonitorV2MuteRuleTerse
     */
    schedule: MonitorV2MuteRuleScheduleTerse;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleTerse
     */
    readonly validFrom: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleTerse
     */
    readonly validTo?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleTerse
     */
    monitorID?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleTerse
     */
    readonly id: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2MuteRuleTerse
     */
    name: string;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2MuteRuleTerse
     */
    readonly isGlobal?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2MuteRuleTerse
     */
    readonly isConditional?: boolean;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2MuteScheduleType {
    OneTime = 'OneTime'
}

/**
 * 
 * @export
 * @interface MonitorV2OneTimeMuteSchedule
 */
export interface MonitorV2OneTimeMuteSchedule {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2OneTimeMuteSchedule
     */
    startTime: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2OneTimeMuteSchedule
     */
    endTime?: string;
}
/**
 * Request body for `PATCH .../monitors/{id}`. Every property is optional. Only these
 * top-level keys participate in the update; see the operation description for merge vs
 * whole-value replacement rules.
 * 
 * @export
 * @interface MonitorV2PatchRequest
 */
export interface MonitorV2PatchRequest {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2PatchRequest
     */
    name?: string;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2PatchRequest
     */
    disabled?: boolean;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2PatchRequest
     */
    description?: string;
    /**
     * 
     * @type {MonitorV2RuleKind}
     * @memberof MonitorV2PatchRequest
     */
    ruleKind?: MonitorV2RuleKind;
    /**
     * 
     * @type {MonitorV2Definition}
     * @memberof MonitorV2PatchRequest
     */
    definition?: MonitorV2Definition;
    /**
     * 
     * @type {Array<MonitorV2ActionRule>}
     * @memberof MonitorV2PatchRequest
     */
    actionRules?: Array<MonitorV2ActionRule>;
}


/**
 * 
 * @export
 * @interface MonitorV2PromoteRule
 */
export interface MonitorV2PromoteRule {
    /**
     * 
     * @type {Array<MonitorV2ColumnComparison>}
     * @memberof MonitorV2PromoteRule
     */
    compareColumns?: Array<MonitorV2ColumnComparison>;
}
/**
 * 
 * @export
 * @interface MonitorV2Rule
 */
export interface MonitorV2Rule {
    /**
     * 
     * @type {MonitorV2AlarmLevel}
     * @memberof MonitorV2Rule
     */
    level?: MonitorV2AlarmLevel;
    /**
     * 
     * @type {MonitorV2CountRule}
     * @memberof MonitorV2Rule
     */
    count?: MonitorV2CountRule;
    /**
     * 
     * @type {MonitorV2ThresholdRule}
     * @memberof MonitorV2Rule
     */
    threshold?: MonitorV2ThresholdRule;
    /**
     * 
     * @type {MonitorV2PromoteRule}
     * @memberof MonitorV2Rule
     */
    promote?: MonitorV2PromoteRule;
}


/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2RuleKind {
    Count = 'Count',
    Promote = 'Promote',
    Threshold = 'Threshold'
}

/**
 * Scheduling modes are mutually exclusive. Omit both transform and scheduled for service-chosen defaults. Set transform for continuous transform-driven evaluation, or scheduled for cron-based wall-clock evaluation.
 * 
 * @export
 * @interface MonitorV2Scheduling
 */
export interface MonitorV2Scheduling {
    /**
     * 
     * @type {MonitorV2TransformSchedule}
     * @memberof MonitorV2Scheduling
     */
    transform?: MonitorV2TransformSchedule;
    /**
     * 
     * @type {MonitorV2CronSchedule}
     * @memberof MonitorV2Scheduling
     */
    scheduled?: MonitorV2CronSchedule;
}
/**
 * 
 * @export
 * @interface MonitorV2Terse
 */
export interface MonitorV2Terse {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2Terse
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2Terse
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2Terse
     */
    description?: string;
    /**
     * 
     * @type {boolean}
     * @memberof MonitorV2Terse
     */
    disabled?: boolean;
    /**
     * 
     * @type {number}
     * @memberof MonitorV2Terse
     */
    monitorVersion?: number;
    /**
     * 
     * @type {MonitorV2RuleKind}
     * @memberof MonitorV2Terse
     */
    ruleKind?: MonitorV2RuleKind;
}


/**
 * 
 * @export
 * @interface MonitorV2ThresholdRule
 */
export interface MonitorV2ThresholdRule {
    /**
     * 
     * @type {Array<MonitorV2Comparison>}
     * @memberof MonitorV2ThresholdRule
     */
    compareValues: Array<MonitorV2Comparison>;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2ThresholdRule
     */
    valueColumnName: string;
    /**
     * 
     * @type {MonitorV2ValueAggregation}
     * @memberof MonitorV2ThresholdRule
     */
    aggregation: MonitorV2ValueAggregation;
    /**
     * 
     * @type {Array<MonitorV2ColumnComparison>}
     * @memberof MonitorV2ThresholdRule
     */
    compareGroups?: Array<MonitorV2ColumnComparison>;
}


/**
 * 
 * @export
 * @interface MonitorV2TransformSchedule
 */
export interface MonitorV2TransformSchedule {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2TransformSchedule
     */
    freshnessGoal?: string;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum MonitorV2ValueAggregation {
    AllOf = 'AllOf',
    AnyOf = 'AnyOf',
    AvgOf = 'AvgOf',
    SumOf = 'SumOf'
}

/**
 * 
 * @export
 * @interface MonitorV2WebhookAction
 */
export interface MonitorV2WebhookAction {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2WebhookAction
     */
    url: string;
    /**
     * 
     * @type {MonitorV2HttpType}
     * @memberof MonitorV2WebhookAction
     */
    method: MonitorV2HttpType;
    /**
     * 
     * @type {Array<MonitorV2WebhookHeader>}
     * @memberof MonitorV2WebhookAction
     */
    headers?: Array<MonitorV2WebhookHeader>;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2WebhookAction
     */
    body: string;
    /**
     * 
     * @type {object}
     * @memberof MonitorV2WebhookAction
     */
    fragments?: object;
}


/**
 * 
 * @export
 * @interface MonitorV2WebhookHeader
 */
export interface MonitorV2WebhookHeader {
    /**
     * 
     * @type {string}
     * @memberof MonitorV2WebhookHeader
     */
    header: string;
    /**
     * 
     * @type {string}
     * @memberof MonitorV2WebhookHeader
     */
    value: string;
}
/**
 * 
 * @export
 * @interface MultiStageQuery
 */
export interface MultiStageQuery {
    /**
     * 
     * @type {string}
     * @memberof MultiStageQuery
     */
    outputStage: string;
    /**
     * 
     * @type {Array<StageQuery>}
     * @memberof MultiStageQuery
     */
    stages: Array<StageQuery>;
}
/**
 * 
 * @export
 * @interface OAuthExternalIntegrationRef
 */
export interface OAuthExternalIntegrationRef {
    /**
     * 
     * @type {string}
     * @memberof OAuthExternalIntegrationRef
     */
    id: string;
}
/**
 * Brief record fields for an ObjectRef. This type is polymorphic: additional fields pointing to specific object types (e.g. dataset, dashboard, monitor) may be added in the future as needed.
 * 
 * @export
 * @interface ObjectBrief
 */
export interface ObjectBrief {
    /**
     * 
     * @type {string}
     * @memberof ObjectBrief
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof ObjectBrief
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof ObjectBrief
     */
    iconUrl: string;
    /**
     * 
     * @type {ObjectRef}
     * @memberof ObjectBrief
     */
    managedBy: ObjectRef | null;
}
/**
 * A reference to another resource. Always carries the id; the optional `record` field carries the brief metadata, populated when expand=true. Brief expansion applies to one layer only — fields inside `record` that are themselves ObjectRefs (e.g. `record.managedBy`) are returned id-only, never with their own `record` populated. CEL filter expressions can deeper-resolve via lazy wrapper resolution if needed.
 * 
 * @export
 * @interface ObjectRef
 */
export interface ObjectRef {
    /**
     * 
     * @type {string}
     * @memberof ObjectRef
     */
    id: string;
    /**
     * 
     * @type {ObjectBrief}
     * @memberof ObjectRef
     */
    record?: ObjectBrief;
}
/**
 * A time range with a start and/or end time.
 * @export
 * @interface OpenTimeRange
 */
export interface OpenTimeRange {
    /**
     * 
     * @type {string}
     * @memberof OpenTimeRange
     */
    startTime: string | null;
    /**
     * 
     * @type {string}
     * @memberof OpenTimeRange
     */
    endTime: string | null;
}
/**
 * 
 * @export
 * @interface ParameterArrayInner
 */
export interface ParameterArrayInner {
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInner
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInner
     */
    name?: string;
    /**
     * 
     * @type {ParameterArrayInnerDefaultValue}
     * @memberof ParameterArrayInner
     */
    defaultValue: ParameterArrayInnerDefaultValue;
    /**
     * 
     * @type {ParameterArrayInnerValueKind}
     * @memberof ParameterArrayInner
     */
    valueKind: ParameterArrayInnerValueKind;
}
/**
 * 
 * @export
 * @interface ParameterArrayInnerDefaultValue
 */
export interface ParameterArrayInnerDefaultValue {
    /**
     * 
     * @type {boolean}
     * @memberof ParameterArrayInnerDefaultValue
     */
    bool?: boolean;
    /**
     * 
     * @type {number}
     * @memberof ParameterArrayInnerDefaultValue
     */
    float64?: number;
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInnerDefaultValue
     */
    int64?: string;
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInnerDefaultValue
     */
    string?: string;
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInnerDefaultValue
     */
    timestamp?: string;
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInnerDefaultValue
     */
    duration?: string;
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInnerDefaultValue
     */
    nullValueType?: string;
}
/**
 * 
 * @export
 * @interface ParameterArrayInnerValueKind
 */
export interface ParameterArrayInnerValueKind {
    /**
     * 
     * @type {string}
     * @memberof ParameterArrayInnerValueKind
     */
    type: string;
}
/**
 * 
 * @export
 * @interface ParameterValueArrayInner
 */
export interface ParameterValueArrayInner {
    /**
     * 
     * @type {string}
     * @memberof ParameterValueArrayInner
     */
    id: string;
    /**
     * 
     * @type {ParameterArrayInnerDefaultValue}
     * @memberof ParameterValueArrayInner
     */
    value: ParameterArrayInnerDefaultValue;
}
/**
 * 
 * @export
 * @interface PollDelegatedLogin200Response
 */
export interface PollDelegatedLogin200Response {
    /**
     * Whether this HTTP request was valid (does not indicate completion status).
     * @type {boolean}
     * @memberof PollDelegatedLogin200Response
     */
    ok?: boolean;
    /**
     * If the request has been accepted, denied, or timed out (is settled) then this is true,
     * else if we need to poll again, it is false. If the request is not yet settled, the server
     * side will wait a bit before returning this response, which allows the client to easily
     * implement long polling.
     * 
     * @type {boolean}
     * @memberof PollDelegatedLogin200Response
     */
    settled: boolean;
    /**
     * The access key if the request has been accepted. If the request is settled but not
     * accepted, it will be empty. Note that only the first request after the login is settled
     * will contain the access key, because it is generated once and not stored server side
     * (only a hash is stored, for later API request authentication.) This key imbues the same
     * powers in the Observe API as are available to the issuing user.
     * 
     * @type {string}
     * @memberof PollDelegatedLogin200Response
     */
    accessKey?: string;
    /**
     * A message from the server. In case of error, this may be helpful to display to the user.
     * 
     * @type {string}
     * @memberof PollDelegatedLogin200Response
     */
    message?: string;
}
/**
 * 
 * @export
 * @interface PrimitiveValue
 */
export interface PrimitiveValue {
    /**
     * 
     * @type {boolean}
     * @memberof PrimitiveValue
     */
    bool?: boolean;
    /**
     * 
     * @type {number}
     * @memberof PrimitiveValue
     */
    float64?: number;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValue
     */
    int64?: string;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValue
     */
    string?: string;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValue
     */
    timestamp?: string;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValue
     */
    duration?: string;
    /**
     * 
     * @type {Array<PrimitiveValue>}
     * @memberof PrimitiveValue
     */
    array?: Array<PrimitiveValue>;
    /**
     * 
     * @type {PrimitiveValueLink}
     * @memberof PrimitiveValue
     */
    link?: PrimitiveValueLink;
    /**
     * 
     * @type {PrimitiveValueDatasetref}
     * @memberof PrimitiveValue
     */
    datasetref?: PrimitiveValueDatasetref;
}
/**
 * 
 * @export
 * @interface PrimitiveValueDatasetref
 */
export interface PrimitiveValueDatasetref {
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValueDatasetref
     */
    datasetId?: string;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValueDatasetref
     */
    datasetPath?: string;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValueDatasetref
     */
    stageId?: string;
}
/**
 * 
 * @export
 * @interface PrimitiveValueLink
 */
export interface PrimitiveValueLink {
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValueLink
     */
    datasetId?: string;
    /**
     * 
     * @type {Array<PrimitiveValueLinkPrimaryKeyValueInner>}
     * @memberof PrimitiveValueLink
     */
    primaryKeyValue?: Array<PrimitiveValueLinkPrimaryKeyValueInner>;
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValueLink
     */
    storedLabel?: string;
}
/**
 * 
 * @export
 * @interface PrimitiveValueLinkPrimaryKeyValueInner
 */
export interface PrimitiveValueLinkPrimaryKeyValueInner {
    /**
     * 
     * @type {string}
     * @memberof PrimitiveValueLinkPrimaryKeyValueInner
     */
    name?: string;
}
/**
 * 
 * @export
 * @interface QueryReferenceTables200Response
 */
export interface QueryReferenceTables200Response {
    /**
     * Total number of reference tables available, independent of pagination
     * @type {number}
     * @memberof QueryReferenceTables200Response
     */
    totalCount: number;
    /**
     * List of reference tables that match the query and pagination filters
     * @type {Array<ReferenceTablesTable>}
     * @memberof QueryReferenceTables200Response
     */
    referenceTables: Array<ReferenceTablesTable>;
}
/**
 * Reference to an RBAC group, including id, label, and description.
 * @export
 * @interface RbacGroupRef
 */
export interface RbacGroupRef {
    /**
     * 
     * @type {string}
     * @memberof RbacGroupRef
     */
    id: string;
    /**
     * Deprecated. For compatibility with legacy APIs.
     * @type {string}
     * @memberof RbacGroupRef
     * @deprecated
     */
    legacyId: string;
    /**
     * 
     * @type {string}
     * @memberof RbacGroupRef
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof RbacGroupRef
     */
    description: string;
}
/**
 * 
 * @export
 * @interface ReferenceTablesTable
 */
export interface ReferenceTablesTable {
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    label?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    description?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    iconUrl?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    managedById?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    customerId?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    createdAt?: string;
    /**
     * 
     * @type {User}
     * @memberof ReferenceTablesTable
     */
    createdBy?: User;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    updatedAt?: string;
    /**
     * 
     * @type {User}
     * @memberof ReferenceTablesTable
     */
    updatedBy?: User;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    datasetId?: string;
    /**
     * 
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    checksum?: string;
    /**
     * The schema definition of the reference table
     * @type {Array<ReferenceTablesTableSchemaInner>}
     * @memberof ReferenceTablesTable
     */
    schema?: Array<ReferenceTablesTableSchemaInner>;
    /**
     * The primary key columns of the reference table
     * @type {Array<string>}
     * @memberof ReferenceTablesTable
     */
    primaryKey?: Array<string>;
    /**
     * The field that should be used for the OPAL label
     * @type {string}
     * @memberof ReferenceTablesTable
     */
    labelField?: string;
}
/**
 * 
 * @export
 * @interface ReferenceTablesTableMetadata
 */
export interface ReferenceTablesTableMetadata {
    /**
     * The label of the reference table.
     * @type {string}
     * @memberof ReferenceTablesTableMetadata
     */
    label: string;
    /**
     * The description of the reference table.
     * @type {string}
     * @memberof ReferenceTablesTableMetadata
     */
    description?: string;
    /**
     * The primary key of the reference table.
     * @type {Array<string>}
     * @memberof ReferenceTablesTableMetadata
     */
    primaryKey?: Array<string>;
    /**
     * The field that should be used for the OPAL label.
     * @type {string}
     * @memberof ReferenceTablesTableMetadata
     */
    labelField?: string;
}
/**
 * 
 * @export
 * @interface ReferenceTablesTableMetadataPatch
 */
export interface ReferenceTablesTableMetadataPatch {
    /**
     * The label of the reference table.
     * @type {string}
     * @memberof ReferenceTablesTableMetadataPatch
     */
    label?: string;
    /**
     * The description of the reference table.
     * @type {string}
     * @memberof ReferenceTablesTableMetadataPatch
     */
    description?: string;
}
/**
 * 
 * @export
 * @interface ReferenceTablesTableSchemaInner
 */
export interface ReferenceTablesTableSchemaInner {
    /**
     * The name of the field
     * @type {string}
     * @memberof ReferenceTablesTableSchemaInner
     */
    name: string;
    /**
     * The type of the field (e.g., string, float64, array)
     * @type {string}
     * @memberof ReferenceTablesTableSchemaInner
     */
    type: string;
}
/**
 * 
 * @export
 * @interface ServiceAccountCreateRequest
 */
export interface ServiceAccountCreateRequest {
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountCreateRequest
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountCreateRequest
     */
    description?: string;
    /**
     * The external OAuth binding to create for this service account.
     * @type {ServiceAccountExternalOAuth}
     * @memberof ServiceAccountCreateRequest
     */
    externalOAuth?: ServiceAccountExternalOAuth;
}
/**
 * 
 * @export
 * @interface ServiceAccountExternalOAuth
 */
export interface ServiceAccountExternalOAuth {
    /**
     * 
     * @type {OAuthExternalIntegrationRef}
     * @memberof ServiceAccountExternalOAuth
     */
    integration: OAuthExternalIntegrationRef;
    /**
     * The external identity subject (JWT sub/oid claim) this service account is bound to.
     * @type {string}
     * @memberof ServiceAccountExternalOAuth
     */
    subject: string;
}
/**
 * 
 * @export
 * @interface ServiceAccountListResponse
 */
export interface ServiceAccountListResponse {
    /**
     * 
     * @type {Array<ServiceAccountResource>}
     * @memberof ServiceAccountListResponse
     */
    serviceAccounts: Array<ServiceAccountResource>;
    /**
     * 
     * @type {Meta}
     * @memberof ServiceAccountListResponse
     */
    meta: Meta;
}
/**
 * 
 * @export
 * @interface ServiceAccountResource
 */
export interface ServiceAccountResource {
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountResource
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountResource
     */
    label: string;
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountResource
     */
    description: string;
    /**
     * 
     * @type {User}
     * @memberof ServiceAccountResource
     */
    createdBy: User;
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountResource
     */
    createdAt: string;
    /**
     * 
     * @type {User}
     * @memberof ServiceAccountResource
     */
    updatedBy: User;
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountResource
     */
    updatedAt: string;
    /**
     * Whether the service account is disabled. Disabling a service account will delete all of its API tokens.
     * @type {boolean}
     * @memberof ServiceAccountResource
     */
    disabled: boolean;
    /**
     * Number of API tokens for this service account. Includes recently expired and disabled tokens. Only populated when the expand query parameter is set to true.
     * @type {number}
     * @memberof ServiceAccountResource
     */
    apiTokenCount?: number;
    /**
     * RBAC groups this service account belongs to. Only populated when the expand query parameter is set to true.
     * @type {Array<RbacGroupRef>}
     * @memberof ServiceAccountResource
     */
    rbacGroups?: Array<RbacGroupRef>;
    /**
     * 
     * @type {ServiceAccountExternalOAuth}
     * @memberof ServiceAccountResource
     */
    externalOAuth: ServiceAccountExternalOAuth | null;
}
/**
 * 
 * @export
 * @interface ServiceAccountUpdateRequest
 */
export interface ServiceAccountUpdateRequest {
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountUpdateRequest
     */
    label?: string;
    /**
     * 
     * @type {string}
     * @memberof ServiceAccountUpdateRequest
     */
    description?: string;
    /**
     * Whether the service account is disabled. Disabling a service account will delete all of its API tokens.
     * @type {boolean}
     * @memberof ServiceAccountUpdateRequest
     */
    disabled?: boolean;
    /**
     * 
     * @type {ServiceAccountExternalOAuth}
     * @memberof ServiceAccountUpdateRequest
     */
    externalOAuth?: ServiceAccountExternalOAuth | null;
}
/**
 * 
 * @export
 * @interface StagePresentationInput
 */
export interface StagePresentationInput {
    /**
     * 
     * @type {string}
     * @memberof StagePresentationInput
     */
    limit?: string;
    /**
     * Turn foreign keys into joined-name columns.
     * @type {boolean}
     * @memberof StagePresentationInput
     */
    linkify?: boolean;
    /**
     * How many timechart / aggregate buckets to use by default.
     * @type {string}
     * @memberof StagePresentationInput
     */
    wantBuckets?: string;
    /**
     * How to order the output data.
     * @type {Array<StagePresentationInputOrderColumnsInner>}
     * @memberof StagePresentationInput
     */
    orderColumns?: Array<StagePresentationInputOrderColumnsInner>;
}
/**
 * 
 * @export
 * @interface StagePresentationInputOrderColumnsInner
 */
export interface StagePresentationInputOrderColumnsInner {
    /**
     * 
     * @type {string}
     * @memberof StagePresentationInputOrderColumnsInner
     */
    columnName: string;
    /**
     * 
     * @type {boolean}
     * @memberof StagePresentationInputOrderColumnsInner
     */
    ascending?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof StagePresentationInputOrderColumnsInner
     */
    nullOrdering?: boolean;
}
/**
 * 
 * @export
 * @interface StageQuery
 */
export interface StageQuery {
    /**
     * 
     * @type {string}
     * @memberof StageQuery
     */
    id?: string;
    /**
     * 
     * @type {InputDefinition}
     * @memberof StageQuery
     */
    input: InputDefinition;
    /**
     * 
     * @type {string}
     * @memberof StageQuery
     */
    pipeline: string;
}
/**
 * 
 * @export
 * @interface StartDelegatedLogin200Response
 */
export interface StartDelegatedLogin200Response {
    /**
     * The URL to send the user to in a web browser.
     * @type {string}
     * @memberof StartDelegatedLogin200Response
     */
    url: string;
    /**
     * A token that can be used to poll the tenant for the status of the token creation.
     * This token has some authorization power (because it can be exchanged, once, for a
     * real token) so treat it carefully.
     * 
     * @type {string}
     * @memberof StartDelegatedLogin200Response
     */
    serverToken: string;
}
/**
 * 
 * @export
 * @interface StartDelegatedLogin400Response
 */
export interface StartDelegatedLogin400Response {
    /**
     * Whether this HTTP request was valid (does not indicate completion status).
     * @type {boolean}
     * @memberof StartDelegatedLogin400Response
     */
    ok?: boolean;
    /**
     * A message from the server. In case of error, this may be helpful to display to the user.
     * 
     * @type {string}
     * @memberof StartDelegatedLogin400Response
     */
    message?: string;
}
/**
 * 
 * @export
 * @interface StartDelegatedLoginRequest
 */
export interface StartDelegatedLoginRequest {
    /**
     * The email address of the user to mint credentials for.
     * @type {string}
     * @memberof StartDelegatedLoginRequest
     */
    userEmail: string;
    /**
     * A token generated by the client to identify this particular request.
     * We recommend a random alphanumeric string of length 24 characters or
     * more to avoid collisions. There is no power or security imbued into
     * this token, other than to tell different simultaneous authorization
     * requests for the same user apart.
     * 
     * @type {string}
     * @memberof StartDelegatedLoginRequest
     */
    clientToken: string;
    /**
     * The identifier of the particular integration making this request.
     * Integration should be configured in the Observe back-end, but there
     * is currently no UI for this, so you can use the ID of the Observe
     * command-line tool `observe-tool-abdaf0`.
     * 
     * @type {string}
     * @memberof StartDelegatedLoginRequest
     */
    integration: string;
}
/**
 * Expanded fields for a storage integration reference.
 * Present only when the parent resource is fetched with ?expand=true.
 * 
 * @export
 * @interface StorageIntegrationBrief
 */
export interface StorageIntegrationBrief {
    /**
     * 
     * @type {string}
     * @memberof StorageIntegrationBrief
     */
    label: string;
    /**
     * 
     * @type {StorageIntegrationType}
     * @memberof StorageIntegrationBrief
     */
    type: StorageIntegrationType;
    /**
     * 
     * @type {StorageIntegrationStorageProvider}
     * @memberof StorageIntegrationBrief
     */
    storageProvider: StorageIntegrationStorageProvider;
}


/**
 * A reference to a storage integration, used when embedded in other resources.
 * Always includes id. When the parent resource is fetched with ?expand=true,
 * the record object is present with label, type, and storageProvider.
 * 
 * @export
 * @interface StorageIntegrationRef
 */
export interface StorageIntegrationRef {
    /**
     * 
     * @type {string}
     * @memberof StorageIntegrationRef
     */
    readonly id: string;
    /**
     * 
     * @type {StorageIntegrationBrief}
     * @memberof StorageIntegrationRef
     */
    record?: StorageIntegrationBrief;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum StorageIntegrationStorageProvider {
    S3 = 'S3'
}

/**
 * 
 * @export
 * @enum {string}
 */
export enum StorageIntegrationType {
    Iceberg = 'Iceberg'
}

/**
 * 
 * @export
 * @interface UpdateReferenceTable200Response
 */
export interface UpdateReferenceTable200Response {
    /**
     * Success message
     * @type {string}
     * @memberof UpdateReferenceTable200Response
     */
    message: string;
}
/**
 * 
 * @export
 * @interface User
 */
export interface User {
    /**
     * 
     * @type {string}
     * @memberof User
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    label?: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    timezone?: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    locale?: string;
}
