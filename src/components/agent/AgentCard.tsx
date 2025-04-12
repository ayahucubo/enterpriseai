import { Agent } from '@/types/agent';
import Image from 'next/image';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div
      className="p-6 rounded-lg border border-gray-200 hover:border-[#3f51b5] transition-colors duration-200 cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <Image
            src={agent.icon_url.startsWith('http') ? agent.icon_url : `/images/${agent.icon_url}`}
            alt={agent.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">{agent.name}</h3>
          <p className="text-sm text-gray-600">
            {agent.description}
          </p>
        </div>
      </div>
    </div>
  );
} 