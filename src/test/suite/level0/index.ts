import { runMocha } from '@/test/helper';

const run = function (): Promise<void> {
	return runMocha('sample');
};

export { run };