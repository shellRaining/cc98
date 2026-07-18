<script lang="ts">
import { defineComponent, h, type PropType } from "vue";
import type { RichContentOptions } from "../types";
import UniverseRoot from "../universe/UniverseRoot.vue";
import { parseMarkdown } from "./remark";
import { renderMarkdownRoot } from "./renderMarkdownNode";

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
      h(UniverseRoot, { contentType: "markdown", preserveWhitespace: false }, () =>
        renderMarkdownRoot(parseMarkdown(props.content), props.options),
      );
  },
});
</script>
