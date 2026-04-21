package gg.pryzm.malgeum.widgetbridge

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors

private val ioExecutor = Executors.newSingleThreadExecutor()

class WidgetBridgeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("getWidgetData") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      val prefs = context.getSharedPreferences("malgeum_widget", Context.MODE_PRIVATE)
      prefs.getString("widgetData", null)
    }

    AsyncFunction("setWidgetData") { json: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      // IO 스레드에서 SharedPreferences 쓰기 + 위젯 갱신 — 메인 스레드 ANR 방지
      ioExecutor.execute {
        val prefs = context.getSharedPreferences("malgeum_widget", Context.MODE_PRIVATE)
        prefs.edit().putString("widgetData", json).apply()

        try {
          val manager = AppWidgetManager.getInstance(context)
          val providers = listOf(
            "gg.pryzm.malgeum.widget.MalgeumSmall",
            "gg.pryzm.malgeum.widget.MalgeumMedium"
          )
          for (providerName in providers) {
            val provider = ComponentName(context, providerName)
            val ids = manager.getAppWidgetIds(provider)
            if (ids.isNotEmpty()) {
              val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                component = provider
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
              }
              context.sendBroadcast(intent)
            }
          }
        } catch (_: Exception) {
          // 위젯이 아직 등록되지 않은 경우 무시
        }
      }
    }
  }
}
