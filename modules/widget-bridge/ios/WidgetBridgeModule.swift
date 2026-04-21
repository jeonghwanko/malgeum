import ExpoModulesCore
import WidgetKit

public class WidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("setWidgetData") { (json: String) in
      let defaults = UserDefaults(suiteName: "group.gg.pryzm.malgeum")
      defaults?.set(json, forKey: "widgetData")
      defaults?.synchronize()

      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }

    AsyncFunction("getWidgetData") { () -> String? in
      let defaults = UserDefaults(suiteName: "group.gg.pryzm.malgeum")
      return defaults?.string(forKey: "widgetData")
    }
  }
}
