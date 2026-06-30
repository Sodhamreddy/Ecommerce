<?php
/**
 * Jersey Perfume SmartSlider slides API.
 *
 * Paste this into WordPress Admin -> Code Snippets and set it to run everywhere.
 * It replaces the older jersey/v1/slides snippet and extracts links from
 * SmartSlider params plus nested layer/button/image data.
 */

add_action('rest_api_init', function () {
    register_rest_route('jersey/v1', '/slides', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function ($req) {
            global $wpdb;

            $id = intval($req->get_param('id') ?: 2);
            $debug = (bool) $req->get_param('debug');
            $table = $wpdb->prefix . 'nextend2_smartslider3_slides';

            $slides = $wpdb->get_results($wpdb->prepare(
                "SELECT id, title, thumbnail, params, slide
                 FROM {$table}
                 WHERE slider = %d AND published = 1
                 ORDER BY ordering ASC",
                $id
            ));

            $out = [];

            foreach ($slides as $s) {
                $params = json_decode($s->params ?: '{}', true);
                $layerData = json_decode($s->slide ?: '{}', true);

                $bg = jersey_slider_pick_bg($s, $params);
                if (!$bg) {
                    continue;
                }

                $rawLink = jersey_slider_pick_link($params, $layerData);
                $href = jersey_slider_normalize_href($rawLink);

                $row = [
                    'bg'   => $bg,
                    'href' => $href,
                    'cta'  => 'SHOP NOW',
                ];

                if ($debug) {
                    $row['slide_id'] = intval($s->id);
                    $row['title'] = $s->title;
                    $row['raw_href'] = $rawLink;
                }

                $out[] = $row;
            }

            return rest_ensure_response($out);
        },
    ]);
});

function jersey_slider_pick_bg($slide, $params) {
    $bg = $slide->thumbnail ?: '';

    if (!empty($params['background']['backgroundImage'])) {
        $bg = $params['background']['backgroundImage'];
    } elseif (!empty($params['backgroundImage'])) {
        $bg = $params['backgroundImage'];
    }

    $bg = jersey_slider_expand_tokens($bg);
    if ($bg && !preg_match('#^https?://#i', $bg)) {
        $bg = get_site_url() . '/' . ltrim($bg, '/');
    }

    return $bg;
}

function jersey_slider_pick_link($params, $layerData) {
    $candidates = [];

    foreach ([
        $params['link'] ?? null,
        $params['href'] ?? null,
        $params['url'] ?? null,
        $params['background']['link'] ?? null,
        $params['background']['href'] ?? null,
        $params['background']['url'] ?? null,
    ] as $value) {
        jersey_slider_collect_link_candidate($value, $candidates);
    }

    jersey_slider_walk_for_links($params, $candidates);
    jersey_slider_walk_for_links($layerData, $candidates);

    usort($candidates, function ($a, $b) {
        return jersey_slider_link_score($b) <=> jersey_slider_link_score($a);
    });

    return $candidates[0] ?? '';
}

function jersey_slider_walk_for_links($value, &$candidates) {
    if (is_array($value)) {
        foreach ($value as $key => $child) {
            if (is_string($key) && preg_match('/^(href|url|link|action|onclick|data-href|data-url)$/i', $key)) {
                jersey_slider_collect_link_candidate($child, $candidates);
            }
            jersey_slider_walk_for_links($child, $candidates);
        }
        return;
    }

    jersey_slider_collect_link_candidate($value, $candidates);
}

function jersey_slider_collect_link_candidate($value, &$candidates) {
    if (is_array($value)) {
        foreach (['href', 'url', 'link'] as $key) {
            if (!empty($value[$key])) {
                jersey_slider_collect_link_candidate($value[$key], $candidates);
            }
        }
        return;
    }

    if (!is_string($value)) {
        return;
    }

    $value = html_entity_decode(trim($value), ENT_QUOTES);
    if ($value === '' || $value === '#') {
        return;
    }

    if (strpos($value, '|*|') !== false) {
        $value = trim(explode('|*|', $value)[0]);
    }

    if (preg_match('#(https?:)?//[^\\s"\'<>]+#i', $value, $matches)) {
        $value = $matches[0];
    } elseif (preg_match('#/?(?:product|product-category|shop|offers|blog)/[^\\s"\'<>]*#i', $value, $matches)) {
        $value = $matches[0];
    }

    $value = trim($value);
    if (!jersey_slider_is_usable_link($value)) {
        return;
    }

    if (!in_array($value, $candidates, true)) {
        $candidates[] = $value;
    }
}

function jersey_slider_is_usable_link($href) {
    $href = strtolower($href);

    if ($href === '' || $href === '#' || strpos($href, 'javascript:') === 0) {
        return false;
    }

    if (preg_match('/\\.(png|jpe?g|gif|webp|svg)(\\?|$)/i', $href)) {
        return false;
    }

    if (strpos($href, 'wp-content/uploads') !== false || strpos($href, '$upload$') !== false) {
        return false;
    }

    return preg_match('#(^#?https?://|^/|^(product|product-category|shop|offers|blog)/)#i', $href) === 1;
}

function jersey_slider_link_score($href) {
    $href = strtolower($href);

    if (strpos($href, '/product/') !== false || strpos($href, 'product/') === 0) {
        return 100;
    }
    if (strpos($href, '/product-category/') !== false || strpos($href, 'product-category/') === 0) {
        return 90;
    }
    if (strpos($href, '/shop') !== false || strpos($href, 'shop') === 0) {
        return 50;
    }
    return 10;
}

function jersey_slider_normalize_href($href) {
    $href = jersey_slider_expand_tokens($href);
    $href = html_entity_decode(trim((string) $href), ENT_QUOTES);

    if (strpos($href, '|*|') !== false) {
        $href = trim(explode('|*|', $href)[0]);
    }

    $href = preg_replace('#^#+(?=https?://|/)#i', '', $href);
    $href = preg_replace('#^https?://(?:www\\.)?(?:backend\\.)?jerseyperfume\\.com(?:/index\\.php)?#i', '', $href);
    $href = preg_replace('#^/index\\.php(?=/|$)#i', '', $href);

    if (!$href || $href === '#' || stripos($href, 'javascript:') === 0 || stripos($href, 'article') === 0) {
        return '/shop';
    }

    if (preg_match('#^https?://#i', $href)) {
        return $href;
    }

    return '/' . ltrim($href, '/');
}

function jersey_slider_expand_tokens($value) {
    $value = (string) $value;
    $uploads = wp_get_upload_dir();
    $uploadBase = !empty($uploads['baseurl']) ? $uploads['baseurl'] : get_site_url() . '/wp-content/uploads';

    return str_replace(
        ['$upload$', '$url/'],
        [$uploadBase, get_site_url() . '/'],
        $value
    );
}
