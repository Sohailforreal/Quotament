// index.ts
import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import App from "expo-router/entry";
import { widgetTaskHandler } from "./widget/widget-task-handler";

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);