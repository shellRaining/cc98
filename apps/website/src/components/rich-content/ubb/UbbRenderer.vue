<script lang="ts">
import { UbbRenderDepthError, type UbbNode } from "ubb-core";
import { defineComponent, h, type PropType } from "vue";
import type { RichContentOptions } from "../types";
import UniverseRoot from "../universe/UniverseRoot.vue";
import UniversePlainText from "../universe/UniversePlainText.vue";
import { createUbbRenderContext } from "./context";
import { ubbVueRenderer } from "./registry";

export default defineComponent({
  name: "UbbRenderer",
  props: {
    source: { type: String, required: true },
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
      try {
        const output = ubbVueRenderer.renderNodes(props.nodes, context);
        return h(UniverseRoot, { contentType: "ubb" }, () => output);
      } catch (error) {
        if (!(error instanceof UbbRenderDepthError)) throw error;
        return h(UniverseRoot, { contentType: "ubb" }, () =>
          h(UniversePlainText, { content: props.source }),
        );
      }
    };
  },
});
</script>
