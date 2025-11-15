import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

// Mock the $app/navigation module to prevent navigation errors in tests
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	base: ''
}));

vi.mock('$app/paths', () => ({
	base: ''
}));

describe('/+page.svelte', () => {
	it('should render redirect message', async () => {
		render(Page);

		const message = page.getByText('Redirecting to feed...');
		await expect.element(message).toBeInTheDocument();
	});
});
