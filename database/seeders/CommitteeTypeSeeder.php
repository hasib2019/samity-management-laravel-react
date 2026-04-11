<?php

namespace Database\Seeders;

use App\Models\CommitteeType;
use Illuminate\Database\Seeder;

class CommitteeTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $committeeTypes = [
            [
                'name' => 'First Committee Addition - Approved',
                'name_bn' => 'অনুমোদিত প্রথম কমিটি সংযোজন',
                'description' => 'Committee addition which is already approved by higher authority',
                'validity_period' => 3,
                'member_count_options' => [3, 6, 9, 12],
                'is_active' => true
            ],
            [
                'name' => 'Interim Committee Addition Request',
                'name_bn' => 'অন্তর্বর্তী কমিটি সংযোজনের আবেদন',
                'description' => 'Application for adding interim committee for temporary period',
                'validity_period' => 1,
                'member_count_options' => [3, 6, 9, 12],
                'is_active' => true
            ],
            [
                'name' => 'Selected Committee Addition',
                'name_bn' => 'নির্বাচিত কমিটি সংযোজন',
                'description' => 'Addition of committee with selected/elected members',
                'validity_period' => 3,
                'member_count_options' => [3, 6, 9, 12],
                'is_active' => true
            ],
            [
                'name' => 'Election Committee Appointment Request',
                'name_bn' => 'নির্বাচন কমিটি নিয়োগের আবেদন',
                'description' => 'Application for appointing election committee',
                'validity_period' => 2,
                'member_count_options' => [3, 6, 9, 12],
                'is_active' => true
            ],
        ];

        foreach ($committeeTypes as $type) {
            CommitteeType::firstOrCreate(
                ['name' => $type['name']],
                [
                    'name_bn' => $type['name_bn'],
                    'description' => $type['description'],
                    'validity_period' => $type['validity_period'],
                    'member_count_options' => json_encode($type['member_count_options']),
                    'is_active' => $type['is_active']
                ]
            );
        }
    }
}
