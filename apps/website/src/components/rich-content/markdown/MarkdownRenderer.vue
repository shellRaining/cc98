<script lang="ts">
import { defineComponent, h, type PropType } from "vue";
import type { RichContentOptions } from "../types";
import UniverseRoot from "../universe/UniverseRoot.vue";
import { markdownIt } from "./markdownIt";
import { renderMarkdownTokens } from "./renderMarkdownToken";

export default defineComponent({
  name: "MarkdownRenderer",
  props: {
    content: {
      type: String,
      required: true,
    },
    options: {
      type: Object as PropType<Readonly<RichContentOptions>>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(UniverseRoot, { preserveWhitespace: false }, () =>
        renderMarkdownTokens(markdownIt.parse(props.content, {}), props.options),
      );
  },
});
</script>
