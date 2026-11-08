const { withPodfile } = require("expo/config-plugins");

// Xcode 27 rejects any pod target whose IPHONEOS_DEPLOYMENT_TARGET is below 15.0 ("the range of
// supported deployment target versions is 15.0 to 27.2.x"). Several pods and their resource bundles
// still declare 9.0 to 13.4, which fails the build. Raise anything below the floor during `pod install`.
const MARKER = "# withPodsDeploymentTarget";
const DEFAULT_MIN_TARGET = "15.1";

const snippet = (minTarget) => `    ${MARKER}: Xcode 27 needs pod targets >= 15.0
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < ${minTarget}
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${minTarget}'
        end
      end
    end
`;

/** Returns the Podfile with the snippet added at the top of `post_install` (idempotent). */
function addDeploymentTargetFloor(podfile, minTarget = DEFAULT_MIN_TARGET) {
  if (podfile.includes(MARKER)) return podfile;
  const anchor = /^(\s*post_install do \|installer\|\s*\n)/m;
  if (!anchor.test(podfile)) {
    throw new Error(
      "withPodsDeploymentTarget: couldn't find `post_install do |installer|` in the Podfile",
    );
  }
  return podfile.replace(anchor, `$1${snippet(minTarget)}\n`);
}

const withPodsDeploymentTarget = (config, options = {}) =>
  withPodfile(config, (cfg) => {
    cfg.modResults.contents = addDeploymentTargetFloor(
      cfg.modResults.contents,
      options.minTarget,
    );
    return cfg;
  });

module.exports = withPodsDeploymentTarget;
module.exports.addDeploymentTargetFloor = addDeploymentTargetFloor;
