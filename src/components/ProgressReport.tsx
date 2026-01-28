

const ProgressReport = ({ monthKey }: { monthKey: string }) => (
    <div className="card bg-base-100 shadow p-6 text-center">
      <h3 className="text-lg font-bold">التقرير الشهري: {monthKey}</h3>
    </div>
);

export default ProgressReport