import common from "./common";
import weather from "./weather";
import date from "./date";
import toast from "./toast";
import hero from "./hero";
import recommendations from "./recommendations";
import microcopy from "./microcopy";
import clothing from "./clothing";
import emotional from "./emotional";
import malgeum from "./malgeum";

export default {
  ...common,
  ...weather,
  ...date,
  ...toast,
  ...hero,
  ...recommendations,
  ...microcopy,
  ...clothing,
  ...emotional,
  ...malgeum,
} as const;
