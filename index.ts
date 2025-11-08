// index.ts
import { registerWidgetTaskHandler } from "react-native-android-widget";
// Boot the app via expo-router (side-effect import; DO NOT register it yourself)
import "expo-router/entry";

// Your widget task handler
import { widgetTaskHandler } from "./widget/widget-task-handler";

// Register only the widget handler
registerWidgetTaskHandler(widgetTaskHandler);