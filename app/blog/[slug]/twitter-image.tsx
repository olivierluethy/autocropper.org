// Same card as the post's Open Graph image. `generateStaticParams` has to be
// re-exported too, or this route falls back to rendering on demand.
export {
  default,
  alt,
  size,
  contentType,
  generateStaticParams,
} from "./opengraph-image";
