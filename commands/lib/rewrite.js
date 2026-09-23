// Attributes that hold a single URL.
const URL_ATTRIBUTE_PATTERN = /(\s)(href|src|action|formaction|poster|data-src|data-href)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/gi;
// Attributes that hold a comma-separated list of "url descriptor" pairs.
const SRCSET_ATTRIBUTE_PATTERN = /(\s)(srcset|imagesrcset)(\s*=\s*)("[^"]*"|'[^']*')/gi;
const CSS_URL_PATTERN = /url\(\s*("[^"]*"|'[^']*'|[^)'"\s]*)\s*\)/gi;

function unquote(value) {
    const quote = value[0] === '"' || value[0] === "'" ? value[0] : '';
    return [quote, quote ? value.slice(1, -1) : value];
}

/**
 * Resolves a URL found in `document` (relative URLs included) and, when it
 * points at the forwarding target `from`, rewrites it to the equivalent URL
 * underneath `to`. URLs pointing anywhere else are left untouched.
 */
function rewriteUrl(value, document, from, to) {
    const trimmed = value.trim();

    if (!trimmed || trimmed.startsWith('#')) {
        return value;
    }

    let resolved;
    try {
        resolved = new URL(trimmed, document);
    } catch {
        return value;
    }

    // Leaves mailto:, data:, javascript:, tel: etc. alone.
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
        return value;
    }

    if (resolved.origin !== from.origin) {
        return value;
    }

    const root = from.pathname.replace(/\/$/, '');
    if (root && resolved.pathname !== root && !resolved.pathname.startsWith(root + '/')) {
        return value;
    }

    return to + resolved.pathname.slice(root.length) + resolved.search + resolved.hash;
}

/**
 * Rewrites every URL in `html` that points at the forwarding target so that it
 * points back at the Webhook.site URL instead.
 *
 * @param html      The HTML document returned by the target.
 * @param document  URL the document was fetched from, used to resolve relative URLs.
 * @param from      Root URL of the forwarding target.
 * @param to        Webhook.site URL to rewrite to, without a trailing slash.
 */
export default function rewrite(html, document, from, to) {
    const rewrite = (value) => rewriteUrl(value, document, from, to);

    return html
        .replace(URL_ATTRIBUTE_PATTERN, (match, space, attribute, equals, rawValue) => {
            const [quote, value] = unquote(rawValue);
            return space + attribute + equals + quote + rewrite(value) + quote;
        })
        .replace(SRCSET_ATTRIBUTE_PATTERN, (match, space, attribute, equals, rawValue) => {
            const [quote, value] = unquote(rawValue);
            const rewritten = value
                .split(',')
                .map((candidate) => {
                    const [url, ...descriptors] = candidate.trim().split(/\s+/);
                    return [rewrite(url), ...descriptors].join(' ');
                })
                .join(', ');
            return space + attribute + equals + quote + rewritten + quote;
        })
        .replace(CSS_URL_PATTERN, (match, rawValue) => {
            const [quote, value] = unquote(rawValue);
            return 'url(' + quote + rewrite(value) + quote + ')';
        });
}
