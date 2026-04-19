import { redirect } from 'next/navigation';
import { readOneTimeCodes } from '../../actions';
import { RecoveryCodesView } from './RecoveryCodesView';

export const metadata = {
  title: 'Recovery-Codes · kanbanly',
};

export default async function RecoveryCodesPage() {
  const codes = await readOneTimeCodes();
  if (!codes) redirect('/dashboard');

  return <RecoveryCodesView codes={codes} />;
}
