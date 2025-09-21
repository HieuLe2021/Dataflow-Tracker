// URL to a Power Automate flow that returns a plain text JWT.
export const ACCESS_TOKEN_URL = 'https://de210e4bcd22e60591ca8e841aad4b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1db8c4d15497441287f7c888e8888ed4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yJt8b-T8Y5cybSXqjRjD4nziIvXhPV7F0IfNM-aV6Lg';

export const BASE_DATAVERSE_URL = 'https://wecare-ii.crm5.dynamics.com/api/data/v9.2/msdyn_dataflows';

// Fields to select from the Dataverse API for dataflows.
export const DATAFLOW_FIELDS = [
    'msdyn_dataflowid',
    'msdyn_name',
    'modifiedon',
    'createdon',
    'msdyn_mashupdocument',
    // Additional fields
    'msdyn_description',
    'msdyn_destinationadls',
    'msdyn_emailsettings',
    'msdyn_gatewayobjectid',
    'msdyn_internalversion',
    'msdyn_mashupsettings',
    'msdyn_originaldataflowid',
    'msdyn_refreshhistory',
    'msdyn_refreshsettings',
    '_ownerid_value',
].join(',');
