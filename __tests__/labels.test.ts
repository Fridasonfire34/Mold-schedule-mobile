import { parsePanelLabel } from '../src/labels';

describe('parsePanelLabel', () => {
  it('splits a plain label into job number and panel', () => {
    expect(parsePanelLabel('126-0361-TB---C01')).toEqual({
      jobNumber: '126-0361-TB',
      panel: 'C01',
    });
  });

  it('keeps job suffixes and drops anything after the panel', () => {
    expect(parsePanelLabel('126-0447-ST-B---W03-1')).toEqual({
      jobNumber: '126-0447-ST-B',
      panel: 'W03',
    });
  });

  it('keeps part numbers of any length whole', () => {
    expect(parsePanelLabel('126-0361-TB---W113')?.panel).toBe('W113');
    expect(parsePanelLabel('126-0361-TB---F101-2')?.panel).toBe('F101');
    expect(parsePanelLabel('126-0447-ST-B---C200-1')).toEqual({
      jobNumber: '126-0447-ST-B',
      panel: 'C200',
    });
    expect(parsePanelLabel('126-0361-TB---W1')?.panel).toBe('W1');
  });

  it('ignores surrounding whitespace', () => {
    expect(parsePanelLabel('  124-0361-TB---C01\n')).toEqual({
      jobNumber: '124-0361-TB',
      panel: 'C01',
    });
  });

  it('rejects codes that are not panel labels', () => {
    expect(parsePanelLabel('https://example.com')).toBeNull();
    expect(parsePanelLabel('126-0361-TB-C01')).toBeNull();
    expect(parsePanelLabel('---C01')).toBeNull();
    expect(parsePanelLabel('126-0361-TB---')).toBeNull();
  });
});
