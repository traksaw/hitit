<script lang="ts">
	interface SEOProps {
		title: string;
		description?: string;
		image?: string;
		url?: string;
		type?: string;
	}

	let {
		title,
		description = 'Hit.it - Collaborate on music jams, share audio clips, and create together with musicians worldwide.',
		image = '/og-image.png',
		url = '',
		type = 'website'
	}: SEOProps = $props();

	const siteTitle = 'Hit.it';
	const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
	const canonicalUrl = url || 'https://hitit.app';
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{fullTitle}</title>
	<meta name="title" content={fullTitle} />
	<meta name="description" content={description} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:site_name" content={siteTitle} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={canonicalUrl} />
	<meta property="twitter:title" content={fullTitle} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={image} />

	<!-- Additional Meta Tags -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content="#667eea" />
	<meta
		name="keywords"
		content="music collaboration, audio sharing, jam sessions, music creation, collaborative music, audio clips"
	/>
	<meta name="author" content="Hit.it" />

	<!-- Canonical URL -->
	<link rel="canonical" href={canonicalUrl} />
</svelte:head>
