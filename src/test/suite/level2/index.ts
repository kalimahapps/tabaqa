import { runMocha } from '@/test/helper';

const run = function (): Promise<void> {
	return runMocha('level2');
};

export { run };