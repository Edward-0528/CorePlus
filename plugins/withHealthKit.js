const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const withHealthKit = (config) => {
  // Add HealthKit usage descriptions to Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription = 
      config.modResults.NSHealthShareUsageDescription ||
      "Core+ needs access to read your health data including steps and active energy to display your fitness metrics and help you track your wellness goals.";
    
    config.modResults.NSHealthUpdateUsageDescription = 
      config.modResults.NSHealthUpdateUsageDescription ||
      "Core+ would like to update your health data to keep your wellness information synchronized across your devices.";
    
    return config;
  });

  // Add HealthKit entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = ['health-records'];
    
    return config;
  });

  return config;
};

module.exports = withHealthKit;
