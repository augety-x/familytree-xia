"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { FamilyData, Person } from '@/types/family';
import { UserIcon, CalendarIcon, UserGroupIcon, ChevronDownIcon, ChevronUpIcon, CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { highlightMatch } from '@/utils/search';

interface FamilyTreeProps {
    familyData: FamilyData;
    searchTerm?: string;
    searchInInfo?: boolean;
    loggedInPersonId?: string | null;
    onEditPerson?: (person: Person) => void;
}

// 创建一个映射，用于快速查找人物
const createPersonMap = (data: FamilyData) => {
    const map = new Map<string, Person>();
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) {
                map.set(person.id, person);
            }
        });
    });
    return map;
};

// 创建一个映射，用于查找一个人的所有儿子
const createSonsMap = (data: FamilyData) => {
    const map = new Map<string, Person[]>();
    
    // 初始化每个人的儿子数组
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            if (person.id) {
                map.set(person.id, []);
            }
        });
    });
    
    // 根据 fatherId 填充儿子数组（包含所有儿子）
    data.generations.forEach(generation => {
        generation.people.forEach(person => {
            // 任何有fatherId的人都被认为是其父亲的儿子
            if (person.fatherId && map.has(person.fatherId)) {
                const sons = map.get(person.fatherId) || [];
                sons.push(person);
                map.set(person.fatherId, sons);
            }
        });
    });
    
    return map;
};

const PersonCard = ({ 
    person, 
    personMap,
    sonsMap,
    scrollToPerson,
    searchTerm,
    searchInInfo,
    portraitUrl,
    onPortraitUploaded,
    isOwner,
    onEdit,
}: { 
    person: Person; 
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    scrollToPerson: (personId: string) => void;
    searchTerm?: string;
    searchInInfo?: boolean;
    portraitUrl?: string;
    onPortraitUploaded: () => void;
    isOwner?: boolean;
    onEdit?: (person: Person) => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPortrait, setShowPortrait] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const father = person.fatherId ? personMap.get(person.fatherId) : undefined;
    const sons = person.id ? sonsMap.get(person.id) || [] : [];

    const toggleExpand = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON' || 
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).tagName === 'INPUT') {
            return;
        }
        setExpanded(!expanded);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !person.id) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('personId', person.id);
            formData.append('file', file);
            const res = await fetch('/api/portraits', { method: 'POST', body: formData });
            if (res.ok) onPortraitUploaded();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleMouseEnter = () => {
        if (portraitUrl) {
            hoverTimerRef.current = setTimeout(() => setShowPortrait(true), 300);
        }
    };
    const handleMouseLeave = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setShowPortrait(false);
    };

    useEffect(() => {
        return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
    }, []);

    return (
        <div 
            id={`person-${person.id}`} 
            className={`group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-100 relative overflow-visible cursor-pointer ${expanded ? 'ring-1 ring-blue-300' : ''}`}
            onClick={toggleExpand}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Portrait hover popup */}
            {showPortrait && portraitUrl && (
                <div className="absolute -top-2 right-0 translate-x-[calc(100%+8px)] z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 animate-in fade-in duration-200">
                    <img
                        src={portraitUrl}
                        alt={person.name}
                        className="w-40 h-52 object-cover rounded-md"
                    />
                    <p className="text-center text-xs text-gray-500 mt-1">{person.name}</p>
                </div>
            )}

            <div className="relative">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {portraitUrl ? (
                                <img src={portraitUrl} alt={person.name} className="h-9 w-9 rounded-lg object-cover ring-1 ring-blue-100" />
                            ) : (
                                <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors duration-300">
                                    <UserIcon className="h-5 w-5 text-blue-600" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                            <span dangerouslySetInnerHTML={{ 
                                __html: searchTerm ? highlightMatch(person.name, searchTerm) : person.name 
                            }} />
                        </h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {isOwner && onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(person); }}
                                className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-blue-50"
                                title="编辑我的信息"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="text-gray-500 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-blue-50"
                            title="上传照片"
                        >
                            {uploading ? (
                                <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <CameraIcon className="h-4 w-4" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <div className="text-gray-400">
                            {expanded ? 
                                <ChevronUpIcon className="h-5 w-5" /> : 
                                <ChevronDownIcon className="h-5 w-5" />
                            }
                        </div>
                    </div>
                </div>
                
                {father && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <UserGroupIcon className="h-4 w-4 text-blue-500" />
                        <span>父亲：</span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (father.id) {
                                    scrollToPerson(father.id);
                                }
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                            {father.name}
                        </button>
                    </div>
                )}
                
                {sons.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm mb-2">
                        <UserGroupIcon className="h-4 w-4 text-green-500" />
                        <span>子嗣：</span>
                        {sons.map((son, index) => (
                            <span key={son.id || index}>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (son.id) {
                                            scrollToPerson(son.id);
                                        }
                                    }}
                                    className="text-green-600 hover:text-green-800 hover:underline font-medium"
                                >
                                    {son.name}
                                </button>
                                {index < sons.length - 1 && <span className="mx-1">、</span>}
                            </span>
                        ))}
                    </div>
                )}
                
                <p className={`text-gray-600 text-sm leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-3'}`}>
                    <span dangerouslySetInnerHTML={{ 
                        __html: (searchTerm && searchInInfo) ? highlightMatch(person.info, searchTerm) : person.info 
                    }} />
                </p>
                {(person.birthYear || person.deathYear) && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-4 pt-4 border-t border-gray-100">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                            {person.birthYear}
                            {person.birthYear && person.deathYear && ' - '}
                            {person.deathYear && (person.birthYear ? person.deathYear : ` - ${person.deathYear}`)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Generation = ({ 
    title, 
    people, 
    personMap,
    sonsMap,
    scrollToPerson,
    searchTerm,
    searchInInfo,
    portraits,
    onPortraitUploaded,
    loggedInPersonId,
    onEditPerson,
}: { 
    title: string; 
    people: Person[]; 
    personMap: Map<string, Person>;
    sonsMap: Map<string, Person[]>;
    scrollToPerson: (personId: string) => void;
    searchTerm?: string;
    searchInInfo?: boolean;
    portraits: Record<string, string>;
    onPortraitUploaded: () => void;
    loggedInPersonId?: string | null;
    onEditPerson?: (person: Person) => void;
}) => {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {title}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {people.map((person, index) => (
                    <PersonCard 
                        key={index} 
                        person={person} 
                        personMap={personMap}
                        sonsMap={sonsMap}
                        scrollToPerson={scrollToPerson}
                        searchTerm={searchTerm}
                        searchInInfo={searchInInfo}
                        portraitUrl={person.id ? portraits[person.id] : undefined}
                        onPortraitUploaded={onPortraitUploaded}
                        isOwner={!!loggedInPersonId && person.id === loggedInPersonId}
                        onEdit={onEditPerson}
                    />
                ))}
            </div>
        </div>
    );
};

export default function FamilyTree({ familyData, searchTerm, searchInInfo, loggedInPersonId, onEditPerson }: FamilyTreeProps) {
    const [personMap, setPersonMap] = useState<Map<string, Person>>(new Map());
    const [sonsMap, setSonsMap] = useState<Map<string, Person[]>>(new Map());
    const [portraits, setPortraits] = useState<Record<string, string>>({});
    
    const fetchPortraits = useCallback(async () => {
        try {
            const res = await fetch('/api/portraits');
            if (res.ok) setPortraits(await res.json());
        } catch (err) {
            console.error('Failed to fetch portraits:', err);
        }
    }, []);

    useEffect(() => {
        setPersonMap(createPersonMap(familyData));
        setSonsMap(createSonsMap(familyData));
    }, [familyData]);

    useEffect(() => { fetchPortraits(); }, [fetchPortraits]);
    
    const scrollToPerson = (personId: string) => {
        const element = document.getElementById(`person-${personId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500');
            }, 2000);
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto px-4">
            {familyData.generations.map((generation, index) => (
                <Generation
                    key={index}
                    title={generation.title}
                    people={generation.people}
                    personMap={personMap}
                    sonsMap={sonsMap}
                    scrollToPerson={scrollToPerson}
                    searchTerm={searchTerm}
                    searchInInfo={searchInInfo}
                    portraits={portraits}
                    onPortraitUploaded={fetchPortraits}
                    loggedInPersonId={loggedInPersonId}
                    onEditPerson={onEditPerson}
                />
            ))}
        </div>
    );
} 