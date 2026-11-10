import { NotFoundView } from "@/components/layout/not-found-view";

/** 404 raised with notFound() inside the public site: the (site) layout already adds header and footer. */
export default function SiteNotFound() {
  return <NotFoundView />;
}
