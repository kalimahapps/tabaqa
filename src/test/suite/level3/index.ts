import { runMocha } from '@/test/helper';

const run = function (): Promise<void> {
	return runMocha('level3');
};

export { run };