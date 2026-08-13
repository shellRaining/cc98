<script lang="ts">
import type { UbbNode } from "@cc98/ubb";
import { defineComponent, h, type PropType } from "vue";
import type { RichContentOptions } from "../types";
import UniverseRoot from "../universe/UniverseRoot.vue";
import { createUbbRenderContext } from "./context";
import { ubbVueRenderer } from "./registry";

export default defineComponent({
  name: "UbbRenderer",
  props: {
    nodes: {
      type: Array as PropType<UbbNode[]>,
      required: true,
    },
    options: {
      type: Object as PropType<Readonly<RichContentOptions>>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const context = createUbbRenderContext(props.options);
      return h(UniverseRoot, { contentType: "ubb" }, () =>
        ubbVueRenderer.renderNodes(props.nodes, context),
      );
    };
  },
});
</script>
