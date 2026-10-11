interface TimerProps {
  startTime: Date;
  durationMinutes: number;
}

export default function Timer({ startTime, durationMinutes }: TimerProps) {
  const totalSeconds = durationMinutes * 60;

  return (
    <div className="text-3xl font-mono font-bold text-gray-900">
      {Math.floor(totalSeconds / 60)}:
      {String(totalSeconds % 60).padStart(2, "0")}
    </div>
  );
}
