import { Member } from '../types';

type Props = {
  members: Member[];
  memberName: string;
  setMemberName: (name: string) => void;
  addMember: () => void;
  deleteMember: (id: string) => void;
};

export const MemberManagement = ({ 
  members, 
  memberName, 
  setMemberName, 
  addMember, 
  deleteMember 
}: Props) => {
  return (
    <section className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="font-semibold mb-4 text-lg border-b pb-2">参加者</h2>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          addMember();
        }}
        className="flex flex-col sm:flex-row gap-2 mb-4 items-end"
      >
        <div className="flex-1 flex items-center gap-2">
          <label className="hidden sm:block text-sm font-medium w-14" htmlFor="memberName">名前</label>
          <input
            id="memberName"
            name="memberName"
            type="text"
            className="border rounded px-3 h-10 w-full focus:outline-none focus:ring-2 focus:ring-amber-300"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="名前を入力"
            required
          />
        </div>
        <button 
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-white rounded px-4 h-10 font-semibold transition shadow-md"
        >
          追加
        </button>
      </form>
      <ul className="flex gap-2 flex-wrap">
        {members.map((member) => (
          <li key={member.id} className="bg-gray-100 rounded px-3 py-1 text-sm border border-gray-300 flex items-center gap-1">
            {member.name}
            <button className="ml-1 text-red-500 hover:text-red-700 text-xs" onClick={() => deleteMember(member.id)} title="削除">×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}; 